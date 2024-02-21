import { useLocalStorageState, useRequest } from "ahooks";
import { useCallback, useEffect } from "react";

export interface HistoryTab{
    url: string;
    label: string;
    closable: boolean;
}

// export function useCacheBookTab() {
//     const [tabs, setTabs] = useLocalStorageState<{[key:string] :HistoryTab}>('tabs', {defaultValue: {
//         "/": {
//             url: '/',
//             label: '首页',
//             closable: false,
//         }
//     }})

//     const {run: toCache} = useRequest(async (payload: HistoryTab) => {
//         const res = {
//             ...tabs,
//             [payload.url]: payload,
//         }
//         setTabs(res)
//     }, {
//         manual: true
//     })

//     useEffect(() => {console.log('tabs', tabs)}, [tabs])

//     const {run: remove} = useRequest(async (url: string) => {
//         delete tabs[url]
//         setTabs({...tabs})
//     }, {
//         manual: true,
//     })

//     return {
//         toCache,
//         tabs,
//         remove,
//     }
// }