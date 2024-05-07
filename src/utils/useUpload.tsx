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
import {XMLParser} from 'fast-xml-parser'
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
            if(!profile?.id) {
                throw Error(t('上传失败，请重试'))
            }
            if(uploadingTaskList.some(task => task.name === info.file.name)) {
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
            // const token = JSON.parse(localStorage.getItem('authorization') ?? "{}") as LoginType
            // const ws = new SiWs(`${import.meta.env.VITE_WS_PROTOCOL}://${import.meta.env.VITE_WS_HOST}/island/addBookToIsland?token=${token.token}`)
            // ws.onchange((e: WsChangeEvent) => {
            //     if (e.status === 'end') {
            //         options?.onFinish?.(e)
            //         db.book_blob.add({
            //             id: hash,
            //             blob: file,
            //             updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            //         })
            //     }
            // })

            const httpMeta = {
                size: info.file.size,
                current: 0,
                error: false,
                onUploadProgress: function(type, ...others) {
                    if(type === 'ready') {
                        console.log(this)
                    } else if( type === 'progress')  {
                        others[0].current
                        console.log(others[0])
                        this.current = others?.[0]?.loaded
                    } else if( type === 'finish') {
                        this.current
                    }
                    console.log(uploadingTaskList)
                    uploadingTaskList_update([...uploadingTaskList])
                },
            }
            const eventListender = {
                onTaskReady: function(taskId) {              
                    httpMeta.onUploadProgress('ready', taskId)
                },
                onProgress: function (progressData) {       
                    httpMeta.onUploadProgress('progress', progressData)
                },
                onFileFinish: function (err, data, options) { 
                   httpMeta.onUploadProgress('finish', data, options)
                },
            }

            cos.uploadFile({
                Bucket: import.meta.env.VITE_COS_BUCKET, /* 填入您自己的存储桶，必须字段 */
                Region: import.meta.env.VITE_COS_REGION,  /* 存储桶所在地域，例如ap-beijing，必须字段 */
                Key: `${profile.id}/${hash}`,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
                Body: info.file, /* 必须，上传文件对象，可以是input[type="file"]标签选择本地文件后得到的file对象 */
                SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */
                onTaskReady: eventListender.onTaskReady,
                onProgress: eventListender.onProgress,
                onFileFinish: eventListender.onFileFinish,
                // 支持自定义headers 非必须
                Headers: {
                 "X-Filename": encodeURIComponent(info.file.name) ,
                 "X-Mimetype": encodeURIComponent (info.file.type),
                },
            }, function(err, data) {
                console.log(err || data);
            })
            

            

            // ws.init(info.file, { ...(meta ?? {}), id: hash }, currentIsland)
            uploadingTaskList.unshift({
                httpMeta: httpMeta,
                type: 'upload',
                unread: true,
                name: info.file.name,
                des: meta?.creator ?? meta?.Author ?? info.file.name,
            })
            uploadingTaskList_update(uploadingTaskList)
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