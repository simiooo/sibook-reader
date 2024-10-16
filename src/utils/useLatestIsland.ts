import { useRequest } from "ahooks"
import { useBookState } from "../store"
import { requestor } from "./requestor"
import { DependencyList } from "react"

export function useLatestIsland(refreshDeps: DependencyList) {
    const {currentIsland_update, profile} = useBookState(state => ({
        profile: state.profile,
        currentIsland_update: state.currentIsland_update
    }))
    
    const {runAsync}= useRequest(async () => {
        try {
            if(!profile?.id) {
                return
            }
            const res = await requestor({
                url: '/island/getLatestIsland',
            })
            if(res.data.data.islandId) {
                currentIsland_update(Number(res.data?.data?.islandId ?? -1))
            }
            return Number(res.data?.data?.islandId ?? -1)
        } catch (error) {
            return -1
        }
    }, {
        refreshDeps,
    })
    return [
        runAsync
    ]
}