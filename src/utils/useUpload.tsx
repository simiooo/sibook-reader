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



export function useUpload(
    options?: {
        onFinish: (e: WsChangeEvent) => void
    }
) {
    const {currentIsland} = useBookState(state => ({currentIsland: state.currentIsland}))

    const {db_instance, uploadingTaskList_update, uploadingTaskList} = useBookState((state) => ({
        db_instance: state.db_instance,
        uploadingTaskList_update: state.uploadingTaskList_update,
        uploadingTaskList: state.uploadingTaskList
    }))
    
    const {t} = useTranslation()
    const [loading, setLoading] = useState<boolean>(false)
    // const [fileWs] = useState()

    const upload =useCallback(async (info?: { file?: File; onSuccess?: (v: any) => void; onError?: (error: Error) => void }) => {
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
            const token = JSON.parse(localStorage.getItem('authorization') ?? "{}") as LoginType
            const ws = new SiWs(`ws://${'localhost:8080'}/island/addBookToIsland?token=${token.token}`)
            ws.onchange((e: WsChangeEvent) => {
                if(e.status === 'end') {
                    options?.onFinish?.(e)
                }
            })
            console.log(currentIsland, hash)
            ws.init(info.file, {...(meta ?? {}), id: hash}, currentIsland)
            uploadingTaskList_update([...(uploadingTaskList ?? []), {
                ws,
                name: info.file.name,
                des: meta?.creator ?? meta?.Author ?? info.file.name,
                
            }])
        } catch (error) {
            message.error(error instanceof Error ? error.message : error)
        } finally {
            setLoading(false)
        }

    }, [currentIsland, uploadingTaskList])
        

    return {
        loading,
        upload,
    }

}