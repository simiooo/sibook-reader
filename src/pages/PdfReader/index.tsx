import { Col, Divider, Form, Input, Menu, Row, Spin } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import styles from './index.module.css'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { VList, VListHandle } from "virtua";
import { useLocation, useParams } from 'react-router-dom'
import panzoomify, { PanZoom } from 'panzoom'
import { useDebounceFn, useDrag, useLocalStorageState, useLongPress, useRequest, useSize } from 'ahooks'
import { useBookState } from '../../store'
export const ANIMATION_STATIC = {
    whileTap: { scale: 0.75 },
    whileHover: { scale: 1.35 },
    transition: { type: "spring", stiffness: 400, damping: 17 },
}
type ElementType<T> = T extends (infer U)[] ? U : T;
type OutlineType = ElementType<Awaited<ReturnType<pdfjs.PDFDocumentProxy["getOutline"]>>>
import { usePdfBook } from './usePdfBook'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import { RenderTask } from 'pdfjs-dist';
export const Component = function PdfReader() {
    const [book, pdfDocument, meta, loading, { book_id }] = usePdfBook()
    const [dividerLeft, setDividerLeft] = useState<number>(300)
    const zoomInstance = useRef<PanZoom>(null)
    const params = useParams()
    const [pagination, setPagination] = useLocalStorageState<number>(`pagination:${book_id}`)

    // 用于渲染期间显示的缓存的图片
    const cacheImage = useRef<Map<number, Blob>>(new Map())

    const dividerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const VlistRef = useRef<VListHandle>(null)
    const [canvasScale, setCanvasScale] = useState(1)
    const panzoomifyFactory = () => panzoomify(listRef.current, {
        beforeWheel: function (e) {
            const shouldIgnore = !e.ctrlKey;
            return shouldIgnore;
        },
        onDoubleClick() {
            return false
        },
        beforeMouseDown: function (e) {
            const shouldIgnore = !e.ctrlKey;
            return shouldIgnore;

        },
        zoomDoubleClickSpeed: 1,
    })
    useEffect(() => {
        listRef.current.style.setProperty('--scale-factor', String(1))
        pdfPageRenderHandler(0, (pages ?? []).length ?? 0, pages, { canvasScale, clearDpr: true })
    }, [canvasScale])

    const { run: canvasScaleHandler } = useDebounceFn((e) => {
        const scale = e?.getTransform?.()?.scale
        setCanvasScale(scale ?? 1)
    }, {
        wait: 200,
    })



    useEffect(() => {
        if (!zoomInstance) {
            return
        }
        zoomInstance.current = panzoomifyFactory()
        zoomInstance.current.on('zoom', canvasScaleHandler)
        return () => {
            zoomInstance.current.dispose()
        }
    }, [])

    useDrag(undefined, dividerRef, {
        onDragEnd(event) {
            setDividerLeft(event.clientX)
        },
    })

    // 避免pdfjs重复调用render方法
    const pageRenderTask = useRef<Map<CanvasRenderingContext2D, { renderTask: RenderTask }>>(new Map())
    useEffect(() => {
        pageRenderTask.current.clear()
    }, [params])
    const [form] = Form.useForm()

    // // 初始化页码
    // useEffect(() => {
    //     form.setFieldValue(['page'], pagination)
    //     VlistRef.current.scrollToIndex(pagination - 1)
    // }, [])

    // 生成 pdf 页对象 引用
    const { data: pages } = useRequest(async () => {
        if (!meta?.numPages) return
        const pages = (await Promise.allSettled(
            new Array(meta.numPages).fill(0).map((el, index) => pdfDocument.getPage(index + 1))
        )).map(el => 'value' in el ? el.value : undefined)
        return pages
    }, {
        refreshDeps: [meta?.numPages]
    })

    const size = useSize(listRef)

    const pdfPageRenderHandler = (startIndex: number, endIndex: number, pages: pdfjs.PDFPageProxy[], options?: { pageIndicator?: number, canvasScale?: number, clearDpr?: boolean }) => {
        // 该方法在缩放时不被调用，需要让它被调用；

        const start = Math.max(0, startIndex)
        const end = Math.min(endIndex, pages?.length) //这里有问题
        if (options?.pageIndicator) {
            form.setFieldValue(['page'], options?.pageIndicator)
            setPagination(options?.pageIndicator)
        }
        for (let i = start; i <= end; i++) {
            const page = pages[i]
            if (!page) {
                continue
            }
            const dpr = window.devicePixelRatio || 1;
            const canvas = [...document.querySelectorAll<HTMLCanvasElement>(`.${styles.canvasContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
            const textLayer = [...document.querySelectorAll<HTMLDivElement>(`.${styles.textLayerContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
            const cacheImageLayer = [...document.querySelectorAll<HTMLImageElement>(`.${styles.pageCacheImage}`)]?.find?.(el => Number(el.dataset?.pageindex) === i)?.firstChild as (HTMLImageElement | undefined)
            const ctx = canvas?.getContext('2d')
            if (!ctx) {
                continue
            }

            // 取消相同引用未完成的渲染任务
            pageRenderTask.current.get(ctx)?.renderTask?.cancel?.()

            // 只缩放没有被缩放的元素
            if (options?.clearDpr || !pageRenderTask.current.get(ctx)) {
                ctx.scale(dpr, dpr)
            }
            const viewport = page.getViewport({ scale: options?.canvasScale ?? canvasScale })
            const textViewport = page.getViewport({ scale: 1 })
            const blob = cacheImage.current.get(i)
            let url: string
            if (blob) {
                url = URL.createObjectURL(blob)
            }

            if (cacheImageLayer && cacheImage.current.has(i)) {
                cacheImageLayer.src = url
                cacheImageLayer.style.display = 'flex'
            }
            const task = page.render({
                viewport,
                canvasContext: ctx
            })

            pdfjs.renderTextLayer({
                textContentSource: page.streamTextContent(),
                viewport: textViewport,
                container: textLayer,
            })

            task.promise.then(() => {
                canvas.toBlob((data) => {
                    cacheImage.current.set(i, data)
                }, 'image/png', 1)
            }).catch(err => {
                // 屏蔽这个异常，因为这个异常是故意的
                if (err instanceof pdfjs.RenderingCancelledException) {
                    return
                }
                console.error(err)
            }).finally(() => {
                if (!url) {
                    return
                }
                URL.revokeObjectURL(url)
                url = null
                cacheImageLayer.src = ''
                cacheImageLayer.style.display = 'none'
            })

            // 避免潜在的竞态情况
            pageRenderTask.current.set(ctx, { renderTask: task })
        }
    }


    return (
        <Spin
            spinning={Object?.values(loading ?? {})?.some?.(loading => loading)}
        >
            <div
                className={styles.container}
            >
                <Row
                    wrap={false}

                >
                    <Col
                        flex={`0 1 ${dividerLeft}px`}
                    >
                        <div
                            className={styles.menuContainer}
                        >
                            <Menu
                                items={pdfToMenuItemHandler(meta?.outline as any)}
                            ></Menu>
                        </div>

                    </Col>
                    <Col
                        flex={'0 1'}
                    >
                        <div
                            ref={dividerRef}
                            className={styles.viewDrag}
                        >

                        </div>
                    </Col>
                    <Col flex={'1 0'}>
                        <div className={styles.reader}>
                            <div
                                className={styles.reader_tooltip}
                            >
                                <div className={styles.page}>
                                    <Form
                                        form={form}
                                        initialValues={{
                                            page: 1
                                        }}
                                        onValuesChange={(v) => {
                                            if (v?.page) {
                                                VlistRef.current.scrollToIndex(v.page)
                                            }
                                        }}
                                    >
                                        <Form.Item
                                            name="page"
                                            normalize={(v?: string) => {
                                                const text = v?.replaceAll(/[^\d]/g, '') || '1'
                                                return Math.max(1, Math.min(meta.numPages as number, Number(text)))
                                            }}
                                        >
                                            <Input
                                                suffix={<span>/ {(meta?.numPages ?? 0) as number}</span>}
                                            ></Input>
                                        </Form.Item>
                                    </Form>

                                </div>
                            </div>
                            <div
                                ref={listRef}
                                style={{
                                    height: '100%',
                                    width: '100%',
                                }}
                            >
                                <VList
                                    ref={VlistRef}
                                    count={pages?.length ?? 0}
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                    }}

                                    overscan={4}
                                    onRangeChange={(startIndex, endIndex) => {
                                        // 该方法在缩放时不被调用，需要让它被调用；
                                        pdfPageRenderHandler(startIndex, endIndex, pages, {
                                            canvasScale,
                                            pageIndicator: startIndex + 1
                                        })
                                    }}
                                >
                                    {(pages ?? []).map((page, index) => {
                                        const viewport = page.getViewport({
                                            scale: 1
                                        })

                                        const dpr = window.devicePixelRatio || 1;
                                        return <div
                                            className={styles.pageContainer}
                                            key={index}
                                        >
                                            <div
                                                className={styles.pageDivider}
                                            ></div>
                                            <div
                                                data-pageindex={index}
                                                style={{
                                                    height: viewport.height,
                                                    width: viewport.width,
                                                    background: 'white',
                                                    left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                                                    top: 12,
                                                }}
                                                className={styles.pageCacheImage}>
                                                <img src="" alt="" />
                                            </div>
                                            <canvas
                                                className={styles.canvasContainer}
                                                width={viewport.width * canvasScale * dpr}
                                                data-pageindex={index}
                                                height={viewport.height * canvasScale * dpr}
                                                style={{
                                                    height: viewport.height,
                                                    width: viewport.width,
                                                    background: 'white',
                                                }}
                                            ></canvas>
                                            <div
                                                data-pageindex={index}
                                                className={`textLayer ${styles.textLayerContainer}`}
                                                style={{
                                                    position: 'absolute',
                                                    left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                                                    top: 12,
                                                }}
                                            ></div>
                                        </div>
                                    })}
                                </VList>
                            </div>


                        </div>
                    </Col>
                </Row>
            </div>
        </Spin>
    )
}


const pdfToMenuItemHandler = (item?: OutlineType[]): ItemType[] => {
    return item?.map(el => {
        return {
            label: el.title,
            origininfo: el,
            key: el.title + JSON.stringify(el?.dest ?? []),
            children: el.items?.length > 0 ? pdfToMenuItemHandler(el.items) : undefined
        }
    })
}