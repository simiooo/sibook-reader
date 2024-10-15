import { useInterval, useRequest } from "ahooks"
import { requestor } from "./requestor"

export function useRefresh() {
    const {
        runAsync: refresh, 
        loading: refreshLoading, 
        data: refreshData,
    } = useRequest(async () =>{
        const res = await requestor({
            url: '/refresh',
            method: 'get'
        })
        localStorage.setItem('authorization', JSON.stringify(res.data))
        if (res.status !== 200) {
            throw Error('登录失败')
        }
        return res
    }, {
        manual: true,
        // refreshOnWindowFocus: true,
        pollingInterval: 1000 * 60 * 60 * 3,
    })

    return [
        refreshData,
        refresh,
        {
            loading: refreshLoading
        }
    ] as const
}