import { useRequest } from "ahooks"
import { message } from "antd"
import axios from "axios"
import { requestor } from "./requestor"

export function useReadingProgress(bookId?: string) {
    const {runAsync: setProgress} = useRequest(async (currentPage?: number) => {
        try {
            if(!currentPage) {
                throw Error('暂无获取到当前阅读进度')
            }
            if(!bookId) {
                throw Error('暂无获取到当前阅读书籍')
            }
            await requestor({
                url: "/cache/bookProgressAdd",
                data: {
                    bookId: bookId,
                    currentPageindex: currentPage ?? -1,
                }
            })
        } catch (error) {
            message.error(error.message)
        }
        
    }, {
        manual: true,
        // onSuccess() {
        //     getProgress()
        // }
    })
    const {data: currentProgress, runAsync: getProgress} = useRequest(async () => {
        try {
            if(!bookId) {
                throw Error('暂无获取到当前阅读书籍')
            }
            const res = await requestor({
                url: "/cache/bookProgressGet",
                data: {
                    bookId: bookId,
                }
            })
            return res?.data?.data
        } catch (error) {
            // message.error(error.message)
        }
        
    }, {
        refreshDeps: [
            bookId,
        ]
    })
    return [currentProgress,setProgress] as const
}