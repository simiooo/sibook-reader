import { useCallback, useState } from "react";
import { useBookState } from "../store";
import { sha256 } from "hash.js";
import dayjs from 'dayjs'
import { readFileAsArrayBuffer } from "../dbs/createBook";



export function useUpload() {
    const db_instance = useBookState((state) => state.db_instance)
    const [loading, setLoading] = useState<boolean>(false)

    const upload = 
        async (info?: { file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void }) => {
            setLoading(true)
                if (!info?.file) {
                    throw Error('请传入文件')
                }
                const MAX_LIMIT = (window?.performance?.memory?.jsHeapSizeLimit as number) * 0.75
            if(info.file.size > MAX_LIMIT) {
                throw Error(`请传入不大于${MAX_LIMIT / 1024 /1024}MB 的书籍`)
            }
            const file = await readFileAsArrayBuffer(info.file)
            
            const res = db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
                if (!info?.file) {
                    throw Error('请传入文件')
                }

                const hash = sha256().update(file).digest('hex')
                const hasSame = await db_instance?.book_items.where('hash').equals(hash).toArray()

                if ((hasSame ?? [])?.length > 0) {
                    throw (Error('请勿重复上传文件'))
                }

                db_instance?.book_items?.add({
                    name: info.file.name,
                    des: info.file.name,
                    sort: dayjs().unix(),
                    fileType: info.file.type,
                    hash,
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
                info?.onError?.(err instanceof Error ? err : Error('未知错误'))
            }).finally(() => {
                setLoading(false)
            })
            await res
        }

    return {
        loading,
        upload
    }

}