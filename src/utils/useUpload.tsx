import { useCallback, useState } from "react";
import { useBookState } from "../store";
import dayjs from 'dayjs'
import { readFileAsArrayBuffer } from "../dbs/createBook";
import { message } from "antd";
import { sha256 } from "./sha256";
import { useTranslation } from "react-i18next";
import { epubMetaParser, pdfMetaParser } from "./getBookMeta";
import { SiWs, WsChangeEvent } from "./jsClient";
import { LoginType } from "../pages/Login";
import { db } from "../dbs/db";
import { cos } from "./coClient";
import pify from 'pify';
import { XMLParser } from 'fast-xml-parser'
import { requestor } from "./requestor";
const parser = new XMLParser();



export function useUpload(
    options?: {
        onFinish: (e: WsChangeEvent) => void
    }
) {
    const { currentIsland } = useBookState(state => ({ currentIsland: state.currentIsland }))

    const { db_instance, uploadingTaskList_update, uploadingTaskList } = useBookState((state) => ({
        db_instance: state.db_instance,
        uploadingTaskList_update: state.uploadingTaskList_update,
        uploadingTaskList: state.uploadingTaskList
    }))

    const { t } = useTranslation()
    const [loading, setLoading] = useState<boolean>(false)
    const profile = useBookState(state => state.profile)
    // const [fileWs] = useState()

    const upload = useCallback(async (info?: { file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void }) => {
        setLoading(true)
        try {
            if (!info?.file) {
                throw Error(t('请传入文件'))
            }
            if (!profile?.id) {
                throw Error(t('上传失败，请重试'))
            }
            if (uploadingTaskList.some(task => task.name === info.file.name)) {
                throw Error(t('文件已存在'))
            }
            if (!['application/epub+zip', 'application/pdf'].includes(info.file.type)) {
                throw Error(t('仅支持 pdf 与 epub 书籍'))
            }
            const MAX_LIMIT = ((window?.performance as any)?.memory?.jsHeapSizeLimit as number) * 0.75
            if (info.file.size > MAX_LIMIT) {
                throw Error(t(`请传入不大于${MAX_LIMIT / 1024 / 1024}MB 的书籍`))
            }
            const file = await readFileAsArrayBuffer(info.file)
            const hash = await sha256(file)
            let meta
            if (info.file.type === 'application/pdf') {
                // meta = await pdfMetaParser(file)
            } else if (info.file.type === 'application/epub+zip') {
                meta = await epubMetaParser(file)
            }

            const httpMeta = {
                size: info.file.size,
                current: 0,
                error: false,
                onUploadProgress: function (type, ...others) {
                    if (type === 'ready') {
                    } else if (type === 'progress') {
                        others[0].current
                        this.current = others?.[0]?.loaded
                    } else if (type === 'finish') {
                        this.current
                    } else if(type === 'error') {
                        this.error = true
                    }
                    uploadingTaskList_update([...uploadingTaskList])
                },
            }
            const eventListender = {
                onTaskReady: function (taskId) {
                    httpMeta.onUploadProgress('ready', taskId)
                },
                onProgress: function (progressData) {
                    httpMeta.onUploadProgress('progress', progressData)
                },
                onFileFinish: function (err, data, options) {
                    httpMeta.onUploadProgress('finish', data, options)
                },
            }
            const task = new Promise((resolve, reject) =>{
                cos.uploadFile({
                    ContentType:`application/octet-stream`,
                    Bucket: import.meta.env.VITE_COS_BUCKET, /* 填入您自己的存储桶，必须字段 */
                    Region: import.meta.env.VITE_COS_REGION,  /* 存储桶所在地域，例如ap-beijing，必须字段 */
                    Key: `/${hash}`,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
                    Body: info.file, /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */
                    SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */
                    onTaskReady: eventListender.onTaskReady,
                    onProgress: eventListender.onProgress,
                    onFileFinish: eventListender.onFileFinish,
                    // 支持自定义headers 非必须
                    Headers: {
                        "x-cos-meta-filename": encodeURIComponent(info.file.name),
                        "x-cos-meta-mimetype": encodeURIComponent(info.file.type),
                        // "size": info.file.size,
                    },
                }, async function (err, data: CosResponseData) {
                    try {
                        const payload: FileUploadPayload = {
                            hash: hash,
                            name: info.file.name,
                            size: info.file.size,
                            islandId: currentIsland,
                        }
                        if (err) {
                            throw Error(err.toString())
                        }
                        const res = await requestor<{ status: number, message: string }>({
                            url: '/cos/uploadSave',
                            data: payload
                        })
                        if(res.data.status !== 200) {
                            throw Error(res.data?.message)
                        }
                        resolve(data)
                    } catch (error) {
                        console.error(error)
                        httpMeta.onUploadProgress('error',error)
                        // message.error('上传失败')
                        reject(error)
                    }
    
                })
            }) 

            uploadingTaskList.unshift({
                httpMeta: httpMeta,
                type: 'upload',
                unread: true,
                name: info.file.name,
                des: meta?.creator ?? meta?.Author ?? info.file.name,
            })
            uploadingTaskList_update(uploadingTaskList)
            await task
        } catch (error) {
            console.log(error)
            message.error(error instanceof Error ? error.message : error)
        } finally {
            setLoading(false)
        }

    }, [currentIsland, uploadingTaskList, profile])


    return {
        loading,
        upload,
    }

}

export interface FileUploadPayload {
    hash: string;
    name: string;
    size: number;
    islandId: number;
}

interface CosResponseHeaders {
    'content-length': string;
    'etag': string;
    'x-cos-request-id': string;
}

interface CosResponseData {
    statusCode: number;
    headers: CosResponseHeaders;
    Location: string;
    ETag: string;
    RequestId: string;
}