import { usePrevious } from "ahooks";
import { useCallback, useEffect, useState } from "react";

interface PaginationParams{
    numPages: number,
    book_id: string,
}

const SCALE_LIMIT = 0.05

export function usePagination(p: PaginationParams) {
    useEffect(() => {
        const cachePageNumber = Number(localStorage.getItem(`book_id:${p.book_id}`))
        setPageNumber(Number.isNaN(cachePageNumber) ? 1 : Math.max(1, cachePageNumber))
        const init_scale = localStorage.getItem(`scale:${p.book_id}`) ?? 1
        setScale(Number.isNaN(Number(init_scale)) ? 1 : Number(init_scale))
    }, [p.book_id])
    const [pageNumber, setPageNumber] = useState<number>(1)
    const previewPageNumber = usePrevious(pageNumber)
    const [scale, setScale] = useState<number>()

    useEffect(() => {
        if (previewPageNumber && previewPageNumber !== pageNumber) {
          localStorage.setItem(`book_id:${p.book_id}`, String(pageNumber || 1))
        }
      }, [pageNumber, previewPageNumber])

    const scaleUp = useCallback(() => {
        const result_scale = Math.min(100, scale + SCALE_LIMIT)
        setScale(result_scale)
        localStorage.setItem(`scale:${p.book_id}`, String(result_scale))
    }, [scale])

    const scaleDown = useCallback(() => {
        const result_scale = Math.max(0.05,  scale - SCALE_LIMIT)
        setScale(result_scale)
        localStorage.setItem(`scale:${p.book_id}`, String(result_scale))
    }, [scale])

    const goNextPage = useCallback(() => {
        setPageNumber(Math.min(p.numPages, pageNumber + 1))
    }, [pageNumber, p.numPages])

    const goPrePage = useCallback(() => {
        setPageNumber(Math.max(1, pageNumber - 1))
    }, [pageNumber, p.numPages])
    return {
        pageNumber,
        scaleUp,
        scaleDown,
        goNextPage,
        goPrePage,
        setPageNumber,
        scale,
    }
}