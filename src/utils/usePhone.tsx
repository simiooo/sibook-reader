import { useResponsive } from "ahooks"
import { useMemo } from "react"

export function usePhone() {
    const { sm, xs, md } = useResponsive()
    const isPhone = useMemo(() => {
      return !md && sm && xs
    }, [sm, xs, md])
    return {isPhone}
}