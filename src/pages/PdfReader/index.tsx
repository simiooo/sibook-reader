import { Col, Divider, Form, Input, Menu, Row, Spin } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import styles from './index.module.css'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { VList, VListHandle } from "virtua";
import { useLocation, useParams } from 'react-router-dom'
import panzoomify, { PanZoom } from 'panzoom'
import { useDebounceFn, useDrag, useLongPress, useRequest, useSize } from 'ahooks'
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
    const [book, pdfDocument, meta, loading] = usePdfBook()
    const [dividerLeft, setDividerLeft] = useState<number>(300)
    const zoomInstance = useRef<PanZoom>(null)
    const params = useParams()

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
        listRef.current.style.setProperty('--scale-factor', String(canvasScale))
    }, [canvasScale])
    const { run: canvasScaleHandler } = useDebounceFn((e) => {
        const scale = e?.getTransform?.()?.scale
        setCanvasScale(scale ?? 1)

        zoomInstance.current = panzoomifyFactory()
    }, {
        wait: 100,
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

                                        const start = Math.max(0, startIndex)
                                        const end = Math.min(endIndex, pages?.length) //这里有问题
                                        form.setFieldValue(['page'], startIndex + 1)
                                        
                                        for (let i = start; i <= end; i++) {
                                            const page = pages[i]
                                            if (!page) {
                                                continue
                                            }
                                            const dpr = window.devicePixelRatio || 1;
                                            const canvas = [...document.querySelectorAll<HTMLCanvasElement>(`.${styles.canvasContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
                                            const textLayer = [...document.querySelectorAll<HTMLDivElement>(`.${styles.textLayerContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
                                            const ctx = canvas?.getContext('2d')
                                            if (!ctx) {
                                                continue
                                            }

                                            // 取消相同引用未完成的渲染任务
                                            pageRenderTask.current.get(ctx)?.renderTask?.cancel?.()

                                            // 只缩放没有被缩放的元素
                                            if (!pageRenderTask.current.get(ctx)) {
                                                ctx.scale(dpr, dpr)
                                            }
                                            const viewport = page.getViewport({ scale: canvasScale })
                                            // console.log({viewport}, 'render')
                                            const task = page.render({
                                                viewport,
                                                canvasContext: ctx
                                            })
                                            pdfjs.renderTextLayer({
                                                textContentSource: page.streamTextContent(),
                                                viewport,
                                                container: textLayer,
                                            })
                                            task.promise.catch(err => {
                                                // 屏蔽这个异常，因为这个异常是故意的
                                                if (err instanceof pdfjs.RenderingCancelledException) {
                                                    return
                                                }
                                                console.error(err)
                                            })

                                            // 避免潜在的竞态情况
                                            pageRenderTask.current.set(ctx, { renderTask: task })
                                        }
                                    }}
                                >
                                    {(pages ?? []).map((page, index) => {
                                        const viewport = page.getViewport({
                                            scale: canvasScale
                                        })
                                        // console.log({viewport}, 'jsx');
                                        
                                        const dpr = window.devicePixelRatio || 1;
                                        return <div
                                            className={styles.pageContainer}
                                            key={index}
                                        >
                                            <div
                                                className={styles.pageDivider}
                                            ></div>
                                            <canvas
                                                className={styles.canvasContainer}
                                                width={viewport.width * dpr}
                                                data-pageindex={index}
                                                height={viewport.height * dpr}
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
                                                    height: viewport.height,
                                                    width: viewport.width,
                                                    position: 'absolute',
                                                    left: ((size?.width ?? 0) - viewport.width) / 2,
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