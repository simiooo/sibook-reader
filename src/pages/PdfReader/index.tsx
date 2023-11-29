import { Col, Menu, Row, Breadcrumb, Spin, Result, Slider, message, Button, Space, Switch, Divider, Input, InputNumber, Modal } from 'antd'
import { Document, Outline, Page } from 'react-pdf';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useBookState } from '../../store';
import { BookItems } from '../../dbs/db';
import { useNavigate, useParams } from 'react-router-dom';
import Draggable from 'react-draggable';
import { CameraOutlined, HomeOutlined, LoadingOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import style from './index.module.css'
const stylecss = style
import { pdfjs } from 'react-pdf';
import worker from 'react-pdf/'
import { useDebounce, useDebounceFn, useEventListener, useKeyPress, useMap, usePrevious, useSize, useThrottle, useThrottleFn } from 'ahooks';
import { createPortal } from 'react-dom';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import List from 'react-virtualized/dist/commonjs/List';

import FloatAiMenu from '../../components/FloatAiMenu';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';
import { motion } from 'framer-motion';
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { ImgToText } from '../../utils/imgToText';
import { readFileAsArrayBuffer } from '../../dbs/createBook';
import { useTranslation } from 'react-i18next';


const SCALE_GAP = 0.1

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const pdfToMenuItemHandler = (pdfItems?: any[]) => {
  return pdfItems?.map(ele => ({
    ...ele,
    label: ele.title,
    key: ele.title,
    value: ele.title,
    children: ele.items?.length > 0 ? pdfToMenuItemHandler(ele.items) : undefined
  }))
}

export default function PdfReader() {
  const db_instance = useBookState(state => state.db_instance)
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const list_ref = useRef(null)
  const pdf_document_ref = useRef<HTMLDivElement>()
  const {t} = useTranslation()
  const [switchOpen, setSwitchOpen] = useState<boolean>(true)
  const navigate = useNavigate()
  const [dragableDisabled, setDragableDisabled] = useState<boolean>(true)
  const container_ref = useRef(null)
  const [pdfOutline, setPdfOutline] = useState<MenuItemType[]>([])
  const [scale, setScale] = useState<number>(1)
  const ThrottleScale = useThrottle(scale, { wait: 40 })
  const [translatorOpen, setTranslatorOpen] = useState<boolean>(false)
  const [explainerOpen, setExplainerOpen] = useState<boolean>(false)
  const [copiedText, setCopiedText] = useState<string>()
  const page_ref = useRef<null>()
  const pageSize = useSize(page_ref)
  const [pageProxy, { set, get }] = useMap<number, PDFPageProxy>()
  const [maxWidthPage, setMaxWidthPage] = useState<PDFPageProxy>()



  const [cropOpen, setCropOpen] = useState<boolean>(false)
  const [screenShot, setScreenShot] = useState<string>()
  const cropRef = useRef()
  const [isPageSelecting, setIsPageSelecting] = useState<boolean>(false)
  const [resultImg, setResultImg] = useState<Uint8Array | null>()
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false)

  const size = useSize(container_ref);
  const { book_id } = useParams()
  const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([])
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])
  const onPageLoadSuccess = useCallback((e: PDFPageProxy) => {
    if (!maxWidthPage) {
      setMaxWidthPage(e)
    }
    if ((e as any)?.originalWidth > (maxWidthPage as any)?.originalWidth) {
      setMaxWidthPage(e)
    }
    set(e._pageIndex, e)
  }, [maxWidthPage])
  const pdfoutlineRef = useRef<HTMLDivElement>(null)

  const [ocrPending, setOcrPending] = useState<boolean>(false)

  const [blob, setBlob] = useState<{ data: Uint8Array }>()
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isUserChangePageNumber, setIsUserChangePageNumber] = useState<boolean>(false)
  const previewPageNumber = usePrevious(pageNumber)
  function onDocumentLoadSuccess({ numPages, ...others }: { numPages: number }): void {
    setNumPages(numPages);
    const cachePageNumber = Number(localStorage.getItem(`book_id:${book_id}`))
    const init_scale = localStorage.getItem(`scale:${book_id}`) ?? 1
    setScale(Number.isNaN(Number(init_scale)) ? 1 : Number(init_scale))
    setIsUserChangePageNumber(true)
    setPageNumber(Number.isNaN(cachePageNumber) ? 1 : Math.max(1, cachePageNumber))
    setTimeout(() => {
      setIsUserChangePageNumber(false)
    }, 0);
  }

  const renderPageHeight = useMemo(() => {
    return scale * ((size?.height ?? 20) - 20)
  }, [size, scale])

  useEffect(() => {
    if (previewPageNumber && previewPageNumber !== pageNumber) {
      localStorage.setItem(`book_id:${book_id}`, String(pageNumber || 1))
    }
  }, [pageNumber, previewPageNumber])

  const init = useCallback(async () => {
    return await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
      const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
      const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
      setBlob({ data: book_blob.blob })
      setBookInfo(book_info)

    })
  }, [])

  useKeyPress('uparrow', () => {
    setPageNumber(Math.max(1, pageNumber - 1))
  })
  useKeyPress(40, () => {
    setPageNumber(Math.min(numPages, pageNumber + 1))
  })

  const copyHandler = useCallback(async () => {
    try {
      const res = await window.navigator.clipboard.readText()
      message.success(t('复制成功'))
      setCopiedText(res)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      message.error(t('粘贴失败'))
    }
  }, [])

  useEventListener('copy', copyHandler)

  const [pagination, setPagination] = useState<number>(0)
  const { run: changePageNumberByInput } = useThrottleFn((e: number) => {
    setIsUserChangePageNumber(true)
    setPageNumber(e)
  }, {
    wait: 50
  })

  // 同步页码组件用
  useEffect(() => {
    if (pageNumber !== pagination) {
      setPagination(pageNumber)
    }
  }, [pageNumber])



  const shotCompleteHandler = useCallback(async () => {
    try {
      setIsRecognizing(true)
      const text = await ImgToText(resultImg)
      await navigator.clipboard.writeText(text)
      message.success(t('读取文字成功，请在ai辅助功能里使用'))
      await copyHandler()
    } catch (error) {
      message.error(error instanceof Error ? error.message : error)
    } finally {
      setIsRecognizing(false)
      setCropOpen(false)
      setIsPageSelecting(false)
      setScreenShot(null)
    }

  }, [resultImg])

  useKeyPress('alt.a', () => {
    setScreenShot(null)
    setIsPageSelecting(true)
  })

  const keydownHandler = useCallback((event) => {
    if (event.ctrlKey) {
      if (event.keyCode === 187 || event.key === '+') {
        event.preventDefault();
        scaleUp()

      } else if (event.keyCode === 189 || event.key === '-') {
        event.preventDefault();
        scaleDown()
      }
    }
  }, [scale, pageNumber, numPages])

  const dragHandler = useCallback((e: KeyboardEvent | MouseEvent) => {
    switch (e.type) {
      case 'keydown':
        setDragableDisabled(false)
        break;
      case 'keyup':
        setDragableDisabled(true)
        break
    }
  }, [scale, pageNumber, numPages])

  useKeyPress('ctrl', dragHandler, {
    events: ['keydown', 'keyup']
  })

  const scrollHandlerForDocument = (e) => {
    if (e?.ctrlKey) {
      e.preventDefault()
    }
  }

  const scaleUp = useCallback(() => {
    const result_scale = Math.min(scale + SCALE_GAP, 100)
    setScale(result_scale)
    localStorage.setItem(`scale:${book_id}`, String(result_scale))
  }, [scale, pageNumber, numPages])
  const scaleDown = useCallback(() => {
    const result_scale = Math.max(scale - SCALE_GAP, 0)
    setScale(result_scale)
    localStorage.setItem(`scale:${book_id}`, String(result_scale))
  }, [scale, pageNumber, numPages])

  const scrollHandler = useCallback((event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      if (event.deltaY < 0) {
        scaleUp()
      } else {
        scaleDown()
      }
    } else {

    }
  }, [scale, pageNumber, numPages])


  useEffect(() => {
    if (isUserChangePageNumber) {
      list_ref.current?.scrollToRow(pageNumber)
    }
  }, [pageNumber])
  useEffect(() => {
    list_ref?.current?.scrollToRow?.(pageNumber)
  }, [scale])


  useEventListener('wheel', scrollHandler, {
    target: pdf_document_ref
  })
  useEffect(() => {
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('wheel', scrollHandlerForDocument, { passive: false })
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      document.removeEventListener('wheel', scrollHandlerForDocument)

    }
  }, [scale, pageNumber, numPages])

  const { run: cropHandler } = useDebounceFn(async (e: Cropper.CropEvent<HTMLImageElement>) => {
    if (!cropRef.current) {
      return
    }
    try {
      ; (cropRef.current as any)?.cropper?.getCroppedCanvas()?.toBlob(async (data) => {
        setResultImg(await readFileAsArrayBuffer(data))
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : error)
    }

  }, {
    wait: 300
  })

  useEffect(() => {
    if (isPageSelecting && screenShot) {
      setCropOpen(true)
    }
  }, [
    screenShot,
    isPageSelecting
  ])

  useEffect(() => {
    if (!pdf_document_ref.current) {
      return
    }
    const textContainer = Array.from(pdf_document_ref.current?.querySelectorAll<HTMLDivElement>('.react-pdf__Page__textContent, .react-pdf__Page__annotations')) ?? []
    if (isPageSelecting) {
      for (const ele of textContainer) {
        ele.style.pointerEvents = 'none'
      }
    } else {
      for (const ele of textContainer) {
        ele.style.pointerEvents = undefined
      }
    }

  }, [isPageSelecting])

  //初始化书籍
  useEffect(() => {
    if (!book_id) {
      return
    }
    init()
    return () => {
    }
  }, [book_id])

  return (
    <Row
      className={style.container}
    >
      <FloatAiMenu
        copiedText={copiedText}
        translator={{
          value: translatorOpen,
          onCancel: setTranslatorOpen
        }}
        explainer={{
          value: explainerOpen,
          onCancel: setExplainerOpen
        }}
      ></FloatAiMenu>
      <Col span={24}>
        <Row
          justify={'space-between'}
          align={'middle'}
        >
          <Col>
            <Space>

              <Breadcrumb
                items={[
                  {
                    title: <a type="link"><HomeOutlined /></a>,
                    onClick: () => navigate('/')
                  },
                  {
                    title: t('该书籍'),
                  }
                ]}
              ></Breadcrumb>
              <Divider
                type="vertical"
              ></Divider>
              <Switch
                checkedChildren={t("目录（开）")}
                unCheckedChildren={t("目录（关）")}
                defaultChecked
                checked={switchOpen}
                onChange={setSwitchOpen}
              />
            </Space>

          </Col>
          <Col>
            <h3>{bookInfo?.name}</h3>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Row
          style={{
            width: '100%'
          }}
        >
          {
            switchOpen ? <Col
              xxl={4}
              xl={4}
              lg={6}
              md={8}
              span={4}
              sm={8}
              xs={8}
              className={style.menu_container}
            >
              <Menu
                items={pdfOutline}
                openKeys={menuOpenKeys}
                selectedKeys={menuSelectedKeys}
                onOpenChange={(e) => {
                  setMenuOpenKeys(e)
                }}
                onSelect={(e) => {
                  setIsUserChangePageNumber(true)
                  const tag = pdfoutlineRef.current?.querySelectorAll(e.keyPath.slice(0, -1).map(ele => 'ul').join(' ') + ' a') as NodeListOf<HTMLAnchorElement>
                  const el = [...tag].find(ele => ele.innerText === e.key)
                  el?.click?.()
                  setMenuSelectedKeys(e.selectedKeys)
                }}
              ></Menu>
            </Col>
              : undefined
          }

          <Col
            flex={'1 1'}
          >
            <div
              ref={container_ref}
              className={[
                style.pdf_container,
                isPageSelecting ? style.pdf_container_selecting : undefined
              ].filter(val => val).join(' ')}
              id="pdf_container">

              <Draggable
                disabled={dragableDisabled}
              >
                <div
                  style={{
                    background: 'transparent',
                  }}
                >
                  <Document
                    inputRef={pdf_document_ref}
                    className={style.pdf_document}
                    loading={<Spin spinning={true}></Spin>}
                    error={<Result
                      status="error"
                      title={t("书籍加载失败")}
                    ></Result>}
                    file={blob}
                    onItemClick={(e) => {
                      setPageNumber(e.pageNumber)
                    }}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    <List
                      rowCount={numPages ?? 0}
                      onRowsRendered={e => {
                        setIsUserChangePageNumber(false)
                        setPageNumber(e.startIndex + 1)
                      }}
                      height={renderPageHeight}
                      width={((maxWidthPage as any)?.originalWidth ?? 1) / ((maxWidthPage as any)?.originalHeight ?? 1) * renderPageHeight * scale}
                      rowHeight={(renderPageHeight + 10) * scale}
                      ref={list_ref}
                      className={style.list_container}
                      rowRenderer={({ key, style, index }) => {
                        return (
                          <div
                            key={key}
                            style={style}
                            onClick={(e) => {
                              if (!isPageSelecting) {
                                return
                              }
                              let parent = (e.target as HTMLDivElement | null)?.parentElement
                              let canvas = parent.querySelector('canvas');
                              while (!canvas) {
                                if (!parent) {
                                  break
                                }
                                parent = parent.parentElement
                                canvas = parent.querySelector('canvas')
                              }
                              try {
                                setScreenShot(canvas.toDataURL('image/png', 1))
                              } catch (error) {
                                message.error(t('选择文档失败'))
                                setScreenShot(null)
                              }
                            }}
                          >
                            <Page
                              className={[
                                style.pddf_pages_si,
                                stylecss.pdf_page_selecting
                              ].join(' ')}
                              height={(renderPageHeight)}
                              scale={ThrottleScale}
                              pageNumber={index + 1}
                              onLoadSuccess={onPageLoadSuccess}
                            ></Page>
                          </div>

                        )
                      }}
                    >
                    </List>

                    <Outline
                      inputRef={pdfoutlineRef}
                      className={style.outline}
                      onItemClick={(e) => {
                        setPageNumber(e.pageNumber)
                      }}
                      onLoadSuccess={e => {
                        setPdfOutline(pdfToMenuItemHandler(e ?? []))
                      }}
                    ></Outline>
                  </Document>
                </div>
              </Draggable>
              <div className={style.scale_controller}>
                <Space
                  size={'middle'}
                >
                  <motion.div
                    title={t("放大")}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={scaleUp}
                  ><PlusCircleOutlined /></motion.div>
                  <motion.div
                    title={t("缩小")}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={scaleDown}
                  ><MinusCircleOutlined /></motion.div>
                  {
                    ocrPending ? <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <LoadingOutlined />
                    </motion.div> : <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title={t("文字转图片")}
                      onClick={() => {
                        message.success(t('请单机选择书籍的某一页'))
                        setScreenShot(null)
                        setIsPageSelecting(true)
                      }}
                    >
                      <CameraOutlined />
                    </motion.div>
                  }

                </Space>
              </div>
              <Row
                className={style.float_tooltip}
                align={'middle'}
              >
                <Col>
                  <Space>
                    <InputNumber
                      bordered={false}
                      value={pagination}
                      onChange={(e) => setPagination(e)}
                      onBlur={(e) => {
                        const target = Number(e.target?.value)
                        if (Number.isNaN(target)) {
                          return
                        }
                        changePageNumberByInput(target)
                      }}
                      style={{
                        width: '50px'
                      }}
                    ></InputNumber>
                    <span>{`/ ${numPages ?? '0'}`}</span>
                  </Space>
                </Col>

              </Row>
            </div>


          </Col>
        </Row>
      </Col>
      <Modal
        open={cropOpen}
        footer={null}
        title={t('裁切图片')}
        onCancel={() => {
          setIsPageSelecting(false)
          setScreenShot(null)
          setCropOpen(false)
        }}
        width={'90vw'}
      >
        {/* <Divider></Divider> */}
        <Row gutter={[12, 12]}>
          <Col span={24}>
            <Row justify={'end'}>
              <Col>
                <Space>
                  <Button
                    loading={isRecognizing}
                    onClick={() => {
                      shotCompleteHandler()
                    }}
                  >{t('完成')}</Button>
                </Space>
              </Col>
            </Row>

          </Col>
          <Col span={24}>
            <Cropper
              src={screenShot}
              style={{ height: 600, width: "100%" }}
              // Cropper.js options
              initialAspectRatio={16 / 9}
              guides={false}
              crop={cropHandler}
              ref={cropRef}
            />
          </Col>
        </Row>


      </Modal>
    </Row>
  )
}
