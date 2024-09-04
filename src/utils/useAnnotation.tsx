import React, { useEffect, useMemo, useState } from 'react'
import { getStroke } from 'perfect-freehand'
import { useInterval, useLocalStorageState, useMap } from 'ahooks'
export function getSvgPathFromStroke(stroke) {
    if (!stroke.length) return ""
  
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length]
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
        return acc
      },
      ["M", ...stroke[0], "Q"]
    )
  
    d.push("Z")
    return d.join(" ")
  }
  
type Line = number[][]
export function useAnnotation(bookId: string, scale: number) {
    const [localLinesMap, setLocalLinesMap] = useLocalStorageState<[string, Line[]][]>(`annotation_book_id:${bookId}`, {
       
    })

    const [linesMap, {set, get, remove, setAll, reset}] = useMap<string, Line[]>(new Map())
    useEffect(() => {
        reset()
        setAll(localLinesMap)
    }, [])
    function handlePointerDown(e: PointerEvent, key: string) {
        if (e.target instanceof SVGSVGElement) {
            e.target.setPointerCapture(e.pointerId)
            const targetBox = e.target.getBoundingClientRect()
            const lines = get(key) ?? []
            set(key, [...lines, [[(e.pageX - targetBox.x) / scale, (e.pageY - targetBox.y) / scale, e.pressure]]])
        }
    }
    function handlePointerMove(e: PointerEvent, key: string) {
        if (e.buttons !== 1) return
        if (!(e.target instanceof SVGSVGElement)) return
        const lines = get(key) ?? []
        const line = lines[lines.length - 1]
        if(!line) {
            return
        }
        const targetBox = e.target.getBoundingClientRect()
        set(key,[...lines, [...line, [(e.pageX - targetBox.x) / scale, (e.pageY - targetBox.y) / scale, e.pressure]]])
    }

    

    useInterval(() => {
        setLocalLinesMap([...linesMap.entries()])
    }, 2000)

    return {
        handlePointerDown,
        handlePointerMove,
        linesMap,
        get(key: string) {
            return (get(key) ?? []).map(line => getSvgPathFromStroke(getStroke(line, {
                size: 16,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
            })))
        },
        remove
    }
}
