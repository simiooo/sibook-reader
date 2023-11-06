import { useCallback, useState } from "react";
import { useBookState } from "../store";
import { sha256 } from "hash.js";
import dayjs from 'dayjs'
import { readFileAsBase64 } from "../dbs/createBook";



export function useUpload() {
    const db_instance = useBookState((state) => state.db_instance)
    const [loading, setLoading] = useState<boolean>(false)

    const upload = 
        async (info?: { file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void }) => {
            
            const res = db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
                setLoading(true)
                if (!info?.file) {
                    throw Error('请传入文件')
                }
                console.log(1);
                
                const file = await readFileAsBase64(info.file)
                console.log(2);

                const hash = sha256().update(file).digest('hex')
                const hasSame = await db_instance?.book_items.where('hash').equals(hash).toArray()
                console.log(3);

                if ((hasSame ?? [])?.length > 0) {
                    throw (Error('请勿重复上传文件'))
                }
                console.log(4);

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
                // return res && res_blob
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