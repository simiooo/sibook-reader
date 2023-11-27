import { Col, Menu, Row, Breadcrumb, Spin, Result, Slider, message, Button, Space, Switch, Divider, Input, InputNumber } from 'antd'
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
import { pdfjs } from 'react-pdf';
import worker from 'react-pdf/'
import { useDebounce, useEventListener, useKeyPress, useMap, usePrevious, useSize, useThrottle, useThrottleFn } from 'ahooks';
import { createPortal } from 'react-dom';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import List from 'react-virtualized/dist/commonjs/List';

import FloatAiMenu from '../../components/FloatAiMenu';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';
import { motion } from 'framer-motion';
import ScreenShot from 'js-web-screen-shot'
import { ImgToText } from '../../utils/imgToText';
import { Console } from 'console';

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
  const pdf_document_ref = useRef()
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


  const [pdf, setPdf] = useState()
  const [ocrPending, setOcrPending] = useState<boolean>(false)

  const [blob, setBlob] = useState<{ data: Uint8Array }>()
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isUserChangePageNumber, setIsUserChangePageNumber] = useState<boolean>(false)
  const previewPageNumber = usePrevious(pageNumber)
  function onDocumentLoadSuccess({ numPages, ...others }: { numPages: number }): void {
    setNumPages(numPages);
    const cachePageNumber = Number(localStorage.getItem(`book_id:${book_id}`))
    setPageNumber(Number.isNaN(cachePageNumber) ? 1 : Math.max(1, cachePageNumber))
  }

  const renderPageHeight = useMemo(() => {
    return scale * ((size?.height ?? 20) - 20)
  }, [size, scale])

  useEffect(() => {
    if (previewPageNumber) {
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
      message.success('复制成功')
      setCopiedText(res)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      message.error('粘贴失败')
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

  useEffect(() => {
    if (pageNumber !== pagination) {
      setPagination(pageNumber)
    }
  }, [pageNumber])

  const shotCompleteHandler = useCallback((e) => {
    
    new ScreenShot({
      completeCallback: async (screen) => {
        try {
          setOcrPending(true)
          const text = await ImgToText(screen?.base64?.slice(22))
          await navigator.clipboard.writeText(text)
          message.success('识别成功,请在 ai 辅助功能中使用')
          await copyHandler()
        } catch (error) {
          message.error(error instanceof Error ? error.message : error)
        } finally {
          setOcrPending(false)
        }
      },
      enableWebRtc: true,
      hiddenToolIco: {
        'save': true,
      },
    })
  }, [])

  useKeyPress('alt.a', shotCompleteHandler)

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
  }, [scale])

  const dragHandler = useCallback((e: KeyboardEvent | MouseEvent) => {
    switch (e.type) {
      case 'keydown':
        setDragableDisabled(false)
        break;
      case 'keyup':
        setDragableDisabled(true)
        break
    }
  }, [])

  useKeyPress('ctrl', dragHandler, {
    events: ['keydown', 'keyup']
  })

  const scrollHandlerForDocument = (e) => {
    if (e?.ctrlKey) {
      e.preventDefault()
    }
  }

  const scaleUp = useCallback(() => {
    setScale(Math.min(scale + SCALE_GAP, 100))
  }, [scale])
  const scaleDown = useCallback(() => {
    setScale(Math.max(scale - SCALE_GAP, 0))
  }, [scale])

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

  const renderPages = useMemo(() => {
    return new Array(numPages).fill(1).map((ele, index) => ({ key: index }))
  }, [numPages])




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
                    title: '该书籍',
                  }
                ]}
              ></Breadcrumb>
              <Divider
                type="vertical"
              ></Divider>
              <Switch
                checkedChildren="目录（开）"
                unCheckedChildren="目录（关）"
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
              className={style.pdf_container}
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
                      title="书籍加载失败"
                    ></Result>}
                    file={blob}
                    onItemClick={(e) => {
                      // setIsUserChangePageNumber(true)
                      setPageNumber(e.pageNumber)
                    }}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    <List
                      rowCount={renderPages.length}
                      onRowsRendered={e => {
                        setIsUserChangePageNumber(false)
                        setPageNumber(e.startIndex + 1)
                      }}
                      height={renderPageHeight}
                      // width={((maxWidthPage as any)?.originalWidth ?? 1) / ((maxWidthPage as any)?.originalHeight ?? 1) * renderPageHeight * scale}
                      width={((maxWidthPage as any)?.originalWidth ?? 1) / ((maxWidthPage as any)?.originalHeight ?? 1) * renderPageHeight * scale}
                      // width={size?.height * scale}
                      rowHeight={(renderPageHeight + 10) * scale}
                      ref={list_ref}
                      className={style.list_container}
                      rowRenderer={({ key, style, index }) => {
                        return (
                          <div
                            key={key}
                            style={style}
                          >
                            <Page
                              className={'pddf_pages_si'}
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
                    title="放大"
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={scaleUp}
                  ><PlusCircleOutlined /></motion.div>
                  <motion.div
                    title="缩小"
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={scaleDown}
                  ><MinusCircleOutlined /></motion.div>
                  {
                    ocrPending ?  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <LoadingOutlined />
                    </motion.div> : <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    title="文字转图片"
                    onClick={shotCompleteHandler}
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
    </Row>
  )
}
