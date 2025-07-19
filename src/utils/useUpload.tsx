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
import pify from 'pify';
import { XMLParser } from 'fast-xml-parser'
import { requestor } from "./requestor";
import { backblazeIns, ProgressFile } from "./backblaze";
import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, PutObjectCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { HttpTask, UploadTask } from "../components/UploadContainer";
const parser = new XMLParser();



export function useUpload(
    options?: {
        onFinish?: (e?: WsChangeEvent) => void
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
                throw Error(t('传输列表 - 文件已存在'))
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

            const httpMeta: HttpTask["httpMeta"] = {
                size: info.file.size,
                current: 0,
                type: "upload",
                error: false,
                id: hash,
                onUploadProgress: function (type, ...others) {
                    if (type === 'ready') {
                        undefined
                    } else if (type === 'progress') {
                        others[0].current
                        this.current = others?.[0]?.loaded
                    } else if (type === 'finish') {
                        this.current
                    } else if (type === 'error') {
                        this.error = true
                    }
                    uploadingTaskList_update([...uploadingTaskList])
                },
            }
            const abortController = new AbortController();
            const task = backblazeIns.putObject(`${hash}`, info.file, {
                onUploadProgress: (...arg) => httpMeta.onUploadProgress('progress', ...arg),
                signal: abortController.signal
            })
            httpMeta.signal = abortController


            const finaltask = task.then(data => {
                const payload: FileUploadPayload = {
                    hash: hash,
                    name: info.file.name,
                    size: info.file.size,
                    islandId: currentIsland,
                }
                return requestor<{ status: number, message: string }>({
                    url: '/storage/backblaze/uploadSave',
                    data: payload
                })
            })
                .then(async requestor => {
                    return db.book_blob.add({
                        id: hash,
                        blob: await readFileAsArrayBuffer(info.file),
                        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    })
                }
                )
                .catch((err) => {
                    httpMeta.onUploadProgress('error', {
                        message: err
                    })
                })
                .finally(() => {
                    options?.onFinish?.()
                })
            uploadingTaskList.unshift({
                httpMeta: httpMeta,
                type: 'upload',
                unread: true,
                name: info.file.name,
                des: meta?.creator ?? meta?.Author ?? info.file.name,
            })
            uploadingTaskList_update(uploadingTaskList)
            await finaltask
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

