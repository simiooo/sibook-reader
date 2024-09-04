import { Alert, Button, Col, Form, Input, Menu, message, Modal, Popconfirm, Popover, Row, Select, Space, Spin, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import styles from './index.module.css'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { VList, VListHandle } from "virtua";
import { useParams } from 'react-router-dom'
import panzoomify, { PanZoom } from 'panzoom'
import { useDebounceFn, useDrag, useLocalStorageState, useMap, useRequest, useSize, useTextSelection, useThrottle, useThrottleFn } from 'ahooks'
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

import { usePdfBook } from './usePdfBook'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import { RenderTask } from 'pdfjs-dist';
import { ImgToText } from '../../utils/imgToText'
import { readFileAsArrayBuffer } from '../../dbs/createBook'
import { CloseOutlined, DeleteOutlined, EditOutlined, FontColorsOutlined, RedoOutlined, TranslationOutlined } from '@ant-design/icons'
import { tesseractLuanguages } from '../../utils/tesseractLanguages'
import { createPortal } from 'react-dom'
import { languages } from '../../utils/locale'
import { useTranslate } from '../../utils/useTranslate'
import TranslatePortal from '../../components/TranslatePortal'
import { useReadingProgress } from '../../utils/useReadingProgress'
import { useAnnotation } from '../../utils/useAnnotation'
import { green } from '../../main'
const OVERSCAN = 4
export const Component = function PdfReader() {
  const [book, pdfDocument, meta, loading, { book_id, contextHolder }] = usePdfBook()
  const [dividerLeft, setDividerLeft] = useState<number>(300)
  const zoomInstance = useRef<PanZoom>(null)
  const params = useParams()
  const [init, setInit] = useState<boolean>(false)
  const [pagination, setPagination] = useLocalStorageState<number>(`pagination:${book_id}`)
  const trashRef = useRef<HTMLDivElement>()

  const [messageIns, messageContextHolder] = message.useMessage()

  const [ocrTaskMap, { set, remove, reset }] = useMap<string, OcrTask>()
  const [selectedMenuKey, setSelectedMenuKey] = useState<string[]>();
  const [remoteProgress, setRemoteProgress] = useReadingProgress(book_id)
  const { run: setRemoteProgressThrottle } = useThrottleFn(setRemoteProgress, {
    wait: 1000 * 30
  })

  const [isRendering, setIsRendering] = useState<boolean>(false)

  const [isEditing, setIsEditing] = useState<boolean>(false)

  const [modalHook, progressHolder] = Modal.useModal()
  useEffect(() => {
    if (!(remoteProgress > 0)) {
      return
    }
    modalHook.confirm({
      title: '云端同步',
      content: '远端已有阅读进度，是否使用云端进度',
      onOk() {
        form.setFieldValue('page', remoteProgress)
      }
    })
  }, [remoteProgress])

  const cachePageImageMap = useRef<Map<number, OffscreenCanvas>>(new Map())

  const destroy = () => {
    cachePageImageMap.current.clear()
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
  const { handlePointerDown, handlePointerMove, linesMap, get: LinesGet, remove: linesRemove } = useAnnotation(book_id, canvasScale)
  const panzoomifyFactory = () => panzoomify(listRef.current, {
    beforeWheel: function (e) {
      const shouldIgnore = !(e.ctrlKey || e.metaKey);
      return shouldIgnore;
    },
    onDoubleClick() {
      return false
    },
    beforeMouseDown: function (e) {
      const shouldIgnore = !(e.ctrlKey || e.metaKey);
      return shouldIgnore;

    },
    zoomDoubleClickSpeed: 1,
  })
  useEffect(() => {
    listRef.current.style.setProperty('--scale-factor', String(1))
    pdfPageRenderHandler(0, (pages ?? []).length ?? 0, pages, { canvasScale, clearDpr: true, cacheRerenderDisable: true })
  }, [canvasScale])


  const { run: canvasScaleHandler } = useDebounceFn((e) => {
    const scale = e?.getTransform?.()?.scale
    setIsRendering(true)
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
          dom.style.transformOrigin = 'center'
        }
        if (result?.rotate && 'style' in dom) {
          dom.style.transform = `rotate(${result?.rotate})`
        }

      })
      const languagesSetting = JSON.stringify(form.getFieldValue('ocr') ?? [])
      set(index + languagesSetting, { status: 'done', fragment: trashRef.current?.children?.[0].cloneNode(true) as Element })
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

  const { data: maxWidthViewPort } = useRequest(async () => {
    return (pages ?? []).reduce((pre, page) => {
      const viewport = page.getViewport()
      return Math.max(pre, viewport.viewBox[2] ?? Number.isNaN(viewport.width) ? 500 : viewport.width)
    }, 0)
  }, {
    refreshDeps: [
      pages
    ]
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
  const { run: pdfPageRenderHandler } = useThrottleFn(async (startIndex: number, endIndex: number, pages: pdfjs.PDFPageProxy[], options?: { pageIndicator?: number, canvasScale?: number, clearDpr?: boolean, cacheRerenderDisable?: boolean }) => {
    // 该方法在缩放时不被调用，需要让它被调用；

    const start = Math.max(pagination - OVERSCAN / 2, startIndex, 0)
    const end = Math.min(pagination + OVERSCAN / 2, Number.isNaN(pages?.length) ? 0 : pages?.length) //这里有问题
    if (options?.pageIndicator && init) {
      form.setFieldValue(['page'], options?.pageIndicator)
      setRemoteProgressThrottle(options?.pageIndicator)
      setPagination(options?.pageIndicator)
    }
    const renderTaskQueue = []
    for (let i = start; i <= end; i++) {
      const page = pages[i]

      const languagesSetting = JSON.stringify(form.getFieldValue('ocr') ?? [])
      const cache = ocrTaskMap.get(i + languagesSetting)
      if (cache && ['hidden', 'done'].includes(cache.status)) {

        getCacheOcrFragment(i, cache)
        cache.status = 'done'
        set(i + languagesSetting, cache)
      }
      if (!page) {
        continue
      }
      const dpr = window.devicePixelRatio || 1;
      const canvas = [...listRef.current.querySelectorAll<HTMLCanvasElement>(`.${styles.canvasContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
      const canvasSub = [...listRef.current.querySelectorAll<HTMLCanvasElement>(`.${styles.canvasSubContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
      const textLayer = [...listRef.current.querySelectorAll<HTMLDivElement>(`.${styles.textLayerContainer}`)].find(el => Number(el.dataset?.pageindex) === i)
      const ctx = canvas?.getContext('2d')
      const subCtx = canvasSub?.getContext('2d')
      if (!ctx) {
        continue
      }
      if (cachePageImageMap.current.has(i)) {
        const data = cachePageImageMap.current.get(i)
        subCtx.drawImage(data, 0, 0, canvasSub.width, canvasSub.height)
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
      renderTaskQueue.push(task.promise)
      task.promise.then(() => {
        if (!cachePageImageMap.current.has(i)) {
          canvas.toBlob(async (data) => {
            const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height)
            const offCtx = offscreenCanvas.getContext('2d')
            offCtx.drawImage(await createImageBitmap(data), 0, 0, canvas.width, canvas.height)
            cachePageImageMap.current.set(i, offscreenCanvas)
          }, 'image/png', 1)
        }
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


      // 避免潜在的竞态情况
      pageRenderTask.current.set(ctx, { renderTask: task })
    }
    Promise.allSettled(renderTaskQueue).finally(() => {
      setIsRendering(false)
    })
  }, {
    wait: 200,
    leading: true,
  })




  return (
    <Spin
      spinning={Object?.values(loading ?? {})?.some?.(loading => loading)}
    >
      <div
        key={1}
      >{progressHolder}</div>
      <div key={2}>
        {messageContextHolder}
      </div>
      {contextHolder}
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
                onSelect={async (v) => {
                  const keyInfo = JSON.parse(v.key)
                  if (keyInfo?.value && keyInfo?.value instanceof Object) {
                    const key = keyInfo.value
                    const destRef = key
                    const pageRef = destRef.find(el => el?.num)
                    const page = pages.find(el => JSON.stringify(el.ref) === JSON.stringify(pageRef ?? "{}"))
                    form.setFieldValue(['page'], page.pageNumber)
                    VlistRef.current.scrollToIndex(page.pageNumber - 1)
                  } else if (keyInfo?.value && typeof keyInfo.value === 'string') {
                    const des = await pdfDocument.getDestination(keyInfo?.value)
                    const pageNumber = await pdfDocument.getPageIndex(des?.[0])
                    form.setFieldValue(['page'], pageNumber)
                    VlistRef.current.scrollToIndex(pageNumber - 1)
                  }
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
                  <Space>
                    <Tooltip
                    placement='rightBottom'
                    title={`是否编辑(当前状态：${isEditing ? '是' : '否'})`}
                    >
                      <Button
                        type={isEditing ? "primary" : 'default'}
                        icon={<EditOutlined />}
                      // type={'primary'}
                      onClick={() => {
                        setIsEditing(!isEditing)
                        if(!isEditing) {
                          messageIns.success('在 pdf 文档上 长按鼠标左键后拖动 进行标记')
                        }
                        
                      }}
                      >

                      </Button>
                    </Tooltip>

                  </Space>
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
                  {/* 阅读器控制区 */}
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
                            minWidth: '6rem',
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
                  width: `${(maxWidthViewPort + 186)}px`,
                }}
              >
                <VList
                  ref={VlistRef}
                  count={pages?.length ?? 0}
                  style={{
                    height: '100%',
                    width: `100%`,
                  }}

                  overscan={OVERSCAN}
                  onRangeChange={(startIndex, endIndex) => {
                    setIsRendering(true)
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
                    const languagesSetting = JSON.stringify(form.getFieldValue('ocr') ?? [])
                    const dpr = window.devicePixelRatio || 1;
                    return <div
                      className={styles.pageContainer}
                      key={index}
                      style={{
                        position: 'relative'
                      }}
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
                          height: viewport?.height ?? 1000,
                          width: viewport?.width,
                          background: 'white',

                        }}
                      ></canvas>
                      <canvas
                        className={styles.canvasSubContainer}
                        width={viewport.width}
                        height={viewport.height}
                        data-pageindex={index}
                        style={{
                          height: viewport.height,
                          width: viewport.width,
                          background: 'transparent',
                          position: 'absolute',
                          left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                          top: 12,
                          opacity: isRendering ? 1 : 0,
                        }}
                      >
                      </canvas>
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
                          display: ocrTaskMap.get(index + languagesSetting)?.status !== 'done' ? 'none' : 'block',
                        }}
                      >

                      </div>
                      <svg
                        data-pageindex={index}
                        onPointerDown={(e: any) => handlePointerDown(e as PointerEvent, index.toString())}
                        onPointerMove={(e: any) => handlePointerMove(e as PointerEvent, index.toString())}
                        className={`annotationCusTom ${styles.annotationCusTom}`}
                        style={{
                          zIndex: 3,
                          height: viewport.height,
                          width: viewport.width,
                          position: 'absolute',
                          left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                          top: 12,
                          pointerEvents:isEditing ? undefined : 'none'
                        }}
                      >
                        {LinesGet(String(index)).map(line => (
                          <path d={line}></path>
                        ))}
                      </svg>
                      <div
                        className={styles.toolbar}
                        style={{
                          position: 'absolute',
                          overflow: 'visible',
                          left: ((size?.width ?? 0) - viewport.width) / 2 - 4,
                          top: 12 / window.devicePixelRatio,
                          zIndex: 2,
                          transform: 'translateX(calc(-100% - 0.25rem))'
                        }}
                      >
                        <Space
                          direction='vertical'
                        >
                          <Tooltip
                            title={'提取图片文字'}

                          >
                            {ocrTaskMap.get(index + languagesSetting)?.status !== 'done' ? <Button
                              type="primary"
                              size='small'
                              loading={ocrTaskMap.get(index + languagesSetting)?.status === 'loading'}
                              icon={<FontColorsOutlined />}
                              onClick={() => {
                                const languagesSetting = JSON.stringify(form.getFieldValue('ocr') ?? [])
                                try {
                                  const cache = ocrTaskMap.get(index + languagesSetting)
                                  if (cache && ['hidden', 'done'].includes(cache.status)) {
                                    getCacheOcrFragment(index, cache)
                                    cache.status = 'done'
                                    set(index + languagesSetting, cache)
                                    return
                                  }
                                  set(index + languagesSetting, { status: 'loading' })
                                  const canvas = listRef.current.querySelector<HTMLCanvasElement>(`canvas[data-pageindex="${index}"]`)
                                  ocrTextLayerBuilder(canvas, index)
                                } catch (error) {
                                  console.error(error)
                                  set(index + languagesSetting, { status: 'error', error })
                                }


                              }}
                            ></Button> : <Button
                              type="primary"
                              size='small'
                              icon={<CloseOutlined />}
                              onClick={() => {
                                const languagesSetting = JSON.stringify(form.getFieldValue('ocr') ?? [])
                                const cache = ocrTaskMap.get(index + languagesSetting)
                                cache.status = 'hidden'
                                set(index + languagesSetting, cache)
                                listRef.current.querySelector(`[data-ocrpageindex="${index}"]`).innerHTML = ''
                              }}
                            ></Button>}
                          </Tooltip>
                          <Tooltip
                            title="删除笔记"
                          >
                            <Popconfirm
                              title="确定删除吗"
                              okType='danger'
                              okButtonProps={{
                                disabled: !isEditing
                              }}
                              onConfirm={() => {
                                linesRemove(String(index))
                              }}
                            >
                              <Button
                                type="primary"
                                danger
                                disabled={!isEditing}
                                icon={<DeleteOutlined />}
                                size='small'
                              ></Button>
                            </Popconfirm>

                          </Tooltip>
                        </Space>
                      </div>
                    </div>
                  })}
                </VList>
              </div>


            </div>
          </Col>
        </Row>
      </div>
      <TranslatePortal
      ></TranslatePortal>
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
      key: JSON.stringify({
        title: el?.title,
        value: el?.dest ?? [],
      }),
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

  const d = (stroke ?? []).reduce(
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