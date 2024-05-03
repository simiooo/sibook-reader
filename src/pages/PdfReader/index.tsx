import { Alert, Button, Col, Divider, Form, Input, Menu, Row, Select, Space, Spin, Switch, Tooltip } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './index.module.css'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { VList, VListHandle } from "virtua";
import { useLocation, useParams } from 'react-router-dom'
import panzoomify, { PanZoom } from 'panzoom'
import { useDebounceFn, useDrag, useLocalStorageState, useLongPress, useMap, useRequest, useSize } from 'ahooks'
import { useBookState } from '../../store'
export const ANIMATION_STATIC = {
  whileTap: { scale: 0.75 },
  whileHover: { scale: 1.35 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
}
type OcrTask = Partial<{
  status: 'error' | "done" | "loading" | 'hidden';
  fragment: DocumentFragment | Element;
  error: Error;
}>
type ElementType<T> = T extends (infer U)[] ? U : T;
type OutlineType = ElementType<Awaited<ReturnType<pdfjs.PDFDocumentProxy["getOutline"]>>>
import { getStroke } from 'perfect-freehand'
import { usePdfBook } from './usePdfBook'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import { RenderTask } from 'pdfjs-dist';
import { ImgToText } from '../../utils/imgToText'
import { readFileAsArrayBuffer } from '../../dbs/createBook'
import { CloseOutlined, FontColorsOutlined, TranslationOutlined } from '@ant-design/icons'
import { tesseractLuanguages } from '../../utils/tesseractLanguages'
export const Component = function PdfReader() {
  const [book, pdfDocument, meta, loading, { book_id }] = usePdfBook()
  const [dividerLeft, setDividerLeft] = useState<number>(300)
  const zoomInstance = useRef<PanZoom>(null)
  const params = useParams()
  const [init, setInit] = useState<boolean>(false)
  const [pagination, setPagination] = useLocalStorageState<number>(`pagination:${book_id}`)
  const trashRef = useRef<HTMLDivElement>()
  const [ocrTaskMap, { set, remove, reset }] = useMap<number, OcrTask>()

  const [selectedMenuKey, setSelectedMenuKey] = useState<string[]>();

  const destroy = () => {
    setSelectedMenuKey([])
    reset()
    setInit(false)
  }

  useEffect(() => {
    destroy()
  }, [book_id])

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

  const getCacheOcrFragment = (index: number, cache: OcrTask) => {
    const ocrContaienr = document.querySelector(`[data-ocrpageindex="${index}"]`)
    if (ocrContaienr.innerHTML.length > 0) {
      return
    }
    ocrContaienr.append(cache?.fragment)
    return
  }

  // const [points, setPoints] = useState<[number, number, number][][]>([])
  // const handlePointerDown = useCallback(async function handlePointerDown(e) {
  //   e.target.setPointerCapture(e.pointerId)
  //   setPoints([...points,[[e.pageX, e.pageY, e.pressure]]])
  // }, [points])

  // const handlePointerMove = useCallback(async function (e) {
  //   if (e.buttons !== 1) return
  //   console.log(points)
  //   const thisPoint = points.pop() ?? []
  //   setPoints([...points, [...thisPoint, [e.pageX, e.pageY, e.pressure]]])
  // }, [points])
  

  // ocr 文字识别层
  const ocrTextLayerBuilder = (canvas: HTMLCanvasElement, index: number) => {
    canvas.toBlob(async (blob) => {
      const containeDom = document.querySelector(`[data-ocrpageindex="${index}"]`)
      const res = await ImgToText(await readFileAsArrayBuffer(new File([blob], index + '.png'),), form.getFieldValue('ocr'))
      if (trashRef.current) {
        trashRef.current.innerHTML = ''
        trashRef.current.append(res)
      }
      traversalDom(trashRef.current?.children?.[0], (dom) => {
        if (dom instanceof DocumentFragment) {
          return
        }
        const ocrAttr = (dom as any)?.attributes?.title?.value?.split(';')?.map(el => {
          const splitIndex = Math.max(0, el?.indexOf(' '))
          return [el?.slice?.(0, splitIndex), el?.slice?.(splitIndex)?.trim?.()]
        }
        ).filter(el => el?.[0] && el?.[1])
        const result = Object.fromEntries(ocrAttr ?? [])
        const factor = window.devicePixelRatio * canvasScale
        if (result?.bbox && dom.className === 'ocr_line' && 'style' in dom) {
          const [left, top, right, bottom] = result?.bbox?.split(' ') ?? []
          dom.style.position = `absolute`
          dom.style.left = `${Number(left) / factor}px`
          dom.style.top = `${Number(top) / factor}px`
          const height = bottom - top
          // const width = right - left
          // const domWidth = dom.getBoundingClientRect().width
          // dom.style.letterSpacing = `${(width - domWidth) / (dom?.innerText ?? '').length / factor}px`
          dom.style.fontSize = `${height / factor}px`

        } else if (result?.bbox && dom.className.indexOf('word') > -1 && 'style' in dom) {
          const [left, top, right, bottom] = result?.bbox?.split(' ') ?? []
          const height = bottom - top
          const width = right - left
          const domWidth = dom.getBoundingClientRect().width
          dom.style.letterSpacing = `${(width - domWidth) / (dom?.innerText ?? '').length / factor}px`
          dom.style.fontSize = `${height / factor}px`
          dom.style.color = 'transparent'
        }
        if (result?.rotate && 'style' in dom) {
          dom.style.transform = `rotate(${result?.rotate})`
        }

      })

      set(index, { status: 'done', fragment: trashRef.current?.children?.[0].cloneNode(true) as Element })
      containeDom.append(trashRef.current?.children?.[0].cloneNode(true))
    })
  }


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

  // 初始化页码
  useEffect(() => {
    if (pages?.length > 0) {
      form.setFieldValue(['page'], pagination ?? 0)
      VlistRef.current.scrollToIndex((pagination ?? 0) - 1)
    }
    setInit(true)
  }, [pages])

  const size = useSize(listRef)

  // pdf 渲染处理
  const pdfPageRenderHandler = async (startIndex: number, endIndex: number, pages: pdfjs.PDFPageProxy[], options?: { pageIndicator?: number, canvasScale?: number, clearDpr?: boolean }) => {
    // 该方法在缩放时不被调用，需要让它被调用；

    const start = Math.max(0, startIndex)
    const end = Math.min(endIndex, pages?.length) //这里有问题
    if (options?.pageIndicator && init) {
      form.setFieldValue(['page'], options?.pageIndicator)
      setPagination(options?.pageIndicator)
    }
    for (let i = start; i <= end; i++) {
      const page = pages[i]


      const cache = ocrTaskMap.get(i)
      if (cache && ['hidden', 'done'].includes(cache.status)) {
        getCacheOcrFragment(i, cache)
        cache.status = 'done'
        set(i, cache)
      }
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
      if (options?.clearDpr || !pageRenderTask.current.get(ctx)) {
        ctx.scale(dpr, dpr)
      }
      const viewport = page.getViewport({ scale: options?.canvasScale ?? canvasScale })
      const textViewport = page.getViewport({ scale: 1 })
      const task = page.render({
        viewport,
        canvasContext: ctx
      })
      pdfjs.renderTextLayer({
        textContentSource: page.streamTextContent(),
        viewport: textViewport,
        container: textLayer,
      })
      task.promise.catch(err => {
        // 屏蔽这个异常，因为这个异常是故意的
        if (err instanceof pdfjs.RenderingCancelledException) {
          return
        }
        console.error(err)
      })

      // 目录的定位
      // page.getAnnotations().then(annotations => {
      //   for(const annotation of annotations) { 
      //     const pageId = annotation.dest?.find(el => el?.['name'])?.name
      //     const outline = meta?.outline?.find?.(el => {
      //       const name = el.dest?.find(el => el?.name)?.name
      //       return name && name === pageId             
      //     })
      //     setSelectedMenuKey([outline?.title + JSON.stringify(outline?.dest ?? [])])
      //   }
      // })


      // 避免潜在的竞态情况
      pageRenderTask.current.set(ctx, { renderTask: task })
    }
  }

  const renderPathData = useMemo(() => {
    return points.map(point => {
      const stroke = getStroke(point, {
        size: 32,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => t,
        start: {
          taper: 0,
          easing: (t) => t,
          cap: true
        },
        end: {
          taper: 100,
          easing: (t) => t,
          cap: true
        }
      })
      const pathData = getSvgPathFromStroke(stroke)
      return pathData
    })
    
  }, [
    points
  ])


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
                onSelect={(v) => {
                  setSelectedMenuKey(v.keyPath ?? [])
                }}
                selectedKeys={selectedMenuKey}
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
                className={styles.tips}
              >
                <Space
                  direction='vertical'
                >
                  <Alert
                    closable
                    type='warning'
                    message={'按住 Ctrl 时，滑动鼠标滚轮可缩放文档'}
                  ></Alert>
                  <Alert
                    closable
                    type='warning'
                    message={'按住 Ctrl 时，鼠标左键可拖动文档位置'}
                  ></Alert>
                </Space>

              </div>
              <div
                className={styles.reader_tooltip}
              >
                <div className={styles.page}>
                  <Form
                    form={form}
                    initialValues={{
                      page: 1,
                      ocr: ['chi_sim', 'jpn', 'eng']
                    }}
                    onValuesChange={(v) => {
                      if (v?.page && init) {
                        VlistRef.current.scrollToIndex(v.page)
                      }
                    }}
                  >
                    <Space
                      align='start'
                    >
                      <Form.Item
                        name="page"
                        normalize={(v?: string) => {
                          const text = v?.replaceAll(/[^\d]/g, '') || '1'
                          return Math.max(1, Math.min(meta.numPages as number, Number(text)))
                        }}
                      >
                        <Input
                          style={{
                            minWidth: '5rem',
                          }}
                          suffix={<span>/ {(meta?.numPages ?? 0) as number}</span>}
                        ></Input>
                      </Form.Item>
                      <Form.Item
                        name={'ocr'}
                      >
                        <Select
                          style={{ minWidth: '9rem' }}
                          options={tesseractLuanguages.map(el => ({
                            label: el.Language,
                            value: el['Lang Code']
                          }))}
                          // maxTagCount={2}
                          mode="multiple"
                          placeholder={'请选择OCR语言'}
                          showSearch
                          filterOption={(value, option) => {
                            return JSON.stringify(option ?? {}).indexOf(value) > -1
                          }}
                        ></Select>
                      </Form.Item>

                    </Space>

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
                      <div
                        className={styles.ocrLayer}
                        data-ocrpageindex={index}
                        style={{
                          position: 'absolute',
                          left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                          top: 12,
                          zIndex: 2,
                          height: viewport.height,
                          width: viewport.width,
                          display: ocrTaskMap.get(index)?.status !== 'done' ? 'none' : 'block',
                        }}
                      >

                      </div>
                      <div
                        className={styles.toolbar}
                        style={{
                          position: 'absolute',
                          left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                          top: 12 / window.devicePixelRatio,
                          zIndex: 2,
                          transform: 'translateX(calc(-100% - 0.25rem))'
                        }}
                      >
                        <Space>
                          <Tooltip
                            title={'提取图片文字'}

                          >
                            {ocrTaskMap.get(index)?.status !== 'done' ? <Button
                              type="primary"
                              size='small'
                              loading={ocrTaskMap.get(index)?.status === 'loading'}
                              icon={<FontColorsOutlined />}
                              onClick={() => {
                                try {
                                  const cache = ocrTaskMap.get(index)
                                  if (cache && ['hidden', 'done'].includes(cache.status)) {
                                    getCacheOcrFragment(index, cache)
                                    cache.status = 'done'
                                    set(index, cache)
                                    return
                                  }
                                  set(index, { status: 'loading' })
                                  const canvas = document.querySelector<HTMLCanvasElement>(`canvas[data-pageindex="${index}"]`)
                                  ocrTextLayerBuilder(canvas, index)
                                } catch (error) {
                                  console.error(error)
                                  set(index, { status: 'error', error })
                                }


                              }}
                            ></Button> : <Button
                              type="primary"
                              size='small'
                              icon={<CloseOutlined />}
                              onClick={() => {
                                const cache = ocrTaskMap.get(index)
                                cache.status = 'hidden'
                                set(index, cache)
                                document.querySelector(`[data-ocrpageindex="${index}"]`).innerHTML = ''
                              }}
                            ></Button>}
                          </Tooltip>
                        </Space>
                      </div>
                      {/* <div
                      className={styles.anontation}
                      style={{
                        position: 'absolute',
                        height: viewport.height,
                          width: viewport.width,
                        left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                        top: 12 / window.devicePixelRatio,
                        zIndex: 2,
                      }}
                      >
                        <svg
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        style={{
                          width: '100%',
                          height: '100%',
                          touchAction: 'none',
                          
                        }}
                        >
                          {renderPathData.map((point) => {
                            return <path d={point}></path>
                          })}
                        </svg>
                      </div> */}
                    </div>
                  })}
                </VList>
              </div>


            </div>
          </Col>
        </Row>
      </div>
      <div
        ref={trashRef}
        style={{ position: 'absolute', top: 0, transform: `translateY(-100%)` }}
        className="trash"></div>
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
export function traversalDom(dom?: Element | HTMLElement | DocumentFragment, cb?: (item: Element | HTMLElement | DocumentFragment) => void) {
  if (!dom) {
    return
  }
  cb?.(dom)
  for (const el of dom?.children ?? []) {
    cb?.(el)
    traversalDom(el, cb)
  }
}


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