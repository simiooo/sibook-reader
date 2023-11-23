import { Col, Menu, Row, Breadcrumb, Spin, Result, Slider, message, Button, Space, Switch, Divider } from 'antd'
import { Document, Outline, Page } from 'react-pdf';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useBookState } from '../../store';
import { BookItems } from '../../dbs/db';
import { useNavigate, useParams } from 'react-router-dom';
import Draggable from 'react-draggable';
import { HomeOutlined } from '@ant-design/icons';
import style from './index.module.css'
import { pdfjs } from 'react-pdf';
import worker from 'react-pdf/'
import { useDebounce, useEventListener, useKeyPress, usePrevious, useSize, useThrottle } from 'ahooks';
import { createPortal } from 'react-dom';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import FloatAiMenu from '../../components/FloatAiMenu';

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

  const size = useSize(container_ref);
  const { book_id } = useParams()
  const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([])
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])

  const pdfoutlineRef = useRef<HTMLDivElement>(null)


  const [pdf, setPdf] = useState()

  const [blob, setBlob] = useState<{ data: Uint8Array }>()
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const previewPageNumber = usePrevious(pageNumber)
  function onDocumentLoadSuccess({ numPages, ...others }: { numPages: number }): void {
    setNumPages(numPages);
    const cachePageNumber = Number(localStorage.getItem(`book_id:${book_id}`))
    setPageNumber(Number.isNaN(cachePageNumber) ? 1 : Math.max(1, cachePageNumber))
  }
  const renderProgress = useMemo(() => {
    return (pageNumber / numPages) * 100
  }, [
    pageNumber,
    numPages
  ])

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

  useEventListener('copy', async () => {
    try {
      const res = await window.navigator.clipboard.readText()
      message.success('复制成功')
      setCopiedText(res)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      message.error('粘贴失败')
    }
  })

  const keydownHandler = useCallback((event) => {
    if (event.ctrlKey) {
      if (event.keyCode === 187 || event.key === '+') {
        event.preventDefault();
        const tempScale = Math.min(scale + SCALE_GAP, 100)
        setScale(tempScale)

      } else if (event.keyCode === 189 || event.key === '-') {
        event.preventDefault();
        const tempScale = Math.max(scale - SCALE_GAP, 0)
        setScale(tempScale)
      }
    }
  }, [scale])

  useKeyPress('ctrl', (e) => {
    switch (e.type) {
      case 'keydown':
        setDragableDisabled(false)
        break;
      case 'keyup':
        setDragableDisabled(true)
        break
    }
  }, {
    events: ['keydown', 'keyup']
  })

  const scrollHandlerForDocument = (e) => {
    if (e?.ctrlKey) {
      e.preventDefault()

    }
  }

  const scrollHandler = useCallback((event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      if (event.deltaY < 0) {
        setScale(Math.min(scale + SCALE_GAP, 100))
      } else {
        setScale(Math.max(scale - SCALE_GAP, 0))
      }
    } else {
      if ((event as any).wheelDeltaY > 0) {
        setPageNumber(Math.max(1, pageNumber - 1))
      } else if ((event as any).wheelDeltaY < 0) {
        setPageNumber(Math.min(numPages, pageNumber + 1))
      }
    }
  }, [scale, pageNumber, numPages])

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
            // sm={16}
            // xs={16}
            // xl={20}
            // md={16}
            // lg={18}
            // span={20}
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
                    background: 'transparent'
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
                      setPageNumber(e.pageNumber)
                    }}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    <Page
                      height={size?.height - 20}
                      scale={ThrottleScale}
                      pageNumber={pageNumber} />
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
            </div>


          </Col>
        </Row>
      </Col>
      <Col span={24}>

      </Col>
      {createPortal(
        <div className={style.reader_progress}><Row>
          <Col
            span={24}
          >
            <Slider
              tooltip={{
                formatter: (v) => `${v}%`
              }}
              onChange={(v) => {
                setPageNumber(Math.max(1, Math.round(v / 100 * numPages)))
              }}
              value={renderProgress} />

          </Col>
        </Row></div>
        , document.body
      )}
    </Row>
  )
}
