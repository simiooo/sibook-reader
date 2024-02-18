import { useLocalStorageState, useRequest } from "ahooks";
import { useEffect } from "react";

export interface HistoryTab{
    url: string;
    label: string;
    closable: boolean;
}

export function useCacheBookTab() {
    const [tabs, setTabs] = useLocalStorageState<{[key:string] :HistoryTab}>('tabs', {defaultValue: {
        "/": {
            url: '/',
            label: '首页',
            closable: false,
        }
    }})

    const {run: toCache} = useRequest(async (payload: HistoryTab) => {
        setTabs({
            ...tabs,
            [payload.url]: payload,
        })
    }, {
        manual: true,
    })

    useEffect(() => {
        console.log(tabs)
    }, [tabs])

    const {run: remove} = useRequest(async (url: string) => {
        delete tabs[url]
        setTabs({...tabs})
    }, {
        manual: true,
    })

    return {
        toCache,
        tabs,
        remove,
    }
}