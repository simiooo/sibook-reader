import { useState } from "react";
import { useBookState } from "../store";
import dayjs from 'dayjs'
import { readFileAsArrayBuffer } from "../dbs/createBook";
import { message } from "antd";
import { sha256 } from "./sha256";
import Dexie from "dexie";
import { useTranslation } from "react-i18next";
import { epubMetaParser, pdfMetaParser } from "./getBookMeta";



export function useUpload() {
    const db_instance = useBookState((state) => state.db_instance)
    const {t} = useTranslation()
    const [loading, setLoading] = useState<boolean>(false)

    const upload =
        async (info?: { file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void }) => {
            setLoading(true)
            try {
                if (!info?.file) {
                    throw Error(t('请传入文件'))
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
                if(info.file.type === 'application/pdf') {
                    // meta = await pdfMetaParser(file)
                } else if(info.file.type === 'application/epub+zip') {
                    meta = await epubMetaParser(file)
                }
                const res = db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
                    if (!info?.file) {
                        throw Error(t('请传入文件'))
                    }
                    

                    const hasSame = await db_instance?.book_items.where('hash').equals(hash).toArray()
                    if ((hasSame ?? [])?.length > 0) {
                        throw (Error(t('请勿重复上传文件')))
                    }

                    db_instance?.book_items?.add({
                        name: info.file.name,
                        des: info.file.name,
                        sort: dayjs().unix(),
                        fileType: info.file.type,
                        hash,
                        meta,
                    })
                    db_instance?.book_blob?.add({
                        id: hash,
                        blob: file,
                    })
                    return true
                }).then(() => {
                    info?.onSuccess?.(info?.file)
                }).catch(err => {
                    console.error(err instanceof Error ? err : err)
                    info?.onError?.(err instanceof Error ? err : Error(t('未知错误')))
                }).finally(() => {
                    setLoading(false)
                })
                await res
            } catch (error) {
                message.error(error instanceof Error ? error.message : error)
            } finally {
                setLoading(false)
            }

        }

    return {
        loading,
        upload
    }

}