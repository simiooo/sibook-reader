import { useCallback, useState } from "react";
import { useBookState } from "../store";
import { sha256 } from "hash.js";
import dayjs from 'dayjs'
import { uploadBook } from "../dbs/createBook";



export function useUpload() {
    const db_instance = useBookState((state) => state.db_instance)
    const [loading, setLoading] = useState<boolean>(false)

    const upload = useCallback(
        async (info?: {file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void}) => {
            setLoading(true)
            try {
                // if(!info?.file) {
                //     throw Error('请传入文件')
                // }
                // const file = await readFileAsBase64(info.file)
                // const hash = sha256().update(file).digest('hex')
                // const hasSame = await db_instance?.select({
                //     from: 'BookItems',
                //     where: {
                //         hash
                //     }
                // })
                // if ((hasSame ?? [])?.length > 0) {
                //     throw (Error('请勿重复上传文件'))
                // }
                // const res = await db_instance?.insert({
                //     into: "BookItems",
                //     upsert: true,
                //     values: [{
                //         name: info.file.name,
                //         des: info.file.name,
                //         sort: dayjs().unix(),
                //         type: info.file.type,
                //         hash,
                //     }],
                // })
                // const res_blob = await db_instance?.insert({
                //     into: "BookBlob",
                //     upsert: true,
                //     values: [{
                //         id: hash,
                //         blob: file,
                //     }],
                // })
                // if (res && res_blob) {
                //     info.onSuccess?.(res)
                // } else {
                //     throw (Error('上传失败'))
                // }
                const res = await db_instance?.transaction({
                    tables: ['BookItems', 'BookBlob'],
                    method: 'uploadBook',
                    data: {
                        file: info?.file,
                        onSuccess: info?.onSuccess,
                        onError: info
                    }
                })
            } catch (error) {
                info?.onError?.(error instanceof Error ? error : Error('未知错误'))
            } finally {
                setLoading(false)
            }
        },
        [],
    )

    return {
        loading,
        upload
    }

}