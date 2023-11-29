import { useResponsive } from "ahooks"
import { useMemo } from "react"

export function usePhone() {
    const { sm, xs, md, lg } = useResponsive()
    const isPhone = useMemo(() => {
      return !lg && md && sm && xs
    }, [sm, xs, md, lg])
    return {isPhone}
}