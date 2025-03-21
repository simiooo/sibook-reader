// import { Col, Menu, Row, Breadcrumb, Spin, Result, Slider, message, Button, Space, Switch, Divider, Input, InputNumber, Modal, Badge, Tooltip } from 'antd'
// import { Document, Outline, Page } from 'react-pdf';
// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';
// import { useBookState } from '../../store';
// import { BookItems } from '../../dbs/db';
// import { useNavigate, useParams } from 'react-router-dom';
// import Draggable from 'react-draggable';
// import { AlertOutlined, AlignCenterOutlined, CameraOutlined, FrownOutlined, HomeOutlined, LeftOutlined, LoadingOutlined, MinusCircleOutlined, PlusCircleOutlined, RadarChartOutlined, ReadOutlined, RightOutlined, SnippetsOutlined, SoundOutlined } from '@ant-design/icons';
// import style from './index.module.css'
// const stylecss = style
// import { pdfjs } from 'react-pdf';
// import worker from 'react-pdf/'
// import { useDebounce, useDebounceFn, useEventListener, useKeyPress, useMap, usePrevious, useRequest, useResponsive, useSize, useThrottle, useThrottleFn } from 'ahooks';
// import { createPortal } from 'react-dom';
// import { ItemType, MenuItemType } from 'antd/es/menu/hooks/useItems';
// import List from 'react-virtualized/dist/commonjs/List';

// // import FloatAiMenu from '../../components/FloatAiMenu';
// import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';
// import { motion } from 'framer-motion';
// import Cropper, { ReactCropperElement } from "react-cropper";
// import "cropperjs/dist/cropper.css";
// import { ImgToText } from '../../utils/imgToText';
// import { readFileAsArrayBuffer } from '../../dbs/createBook';
// import { useTranslation } from 'react-i18next';
// import { usePhone } from '../../utils/usePhone';
// import { usePagination } from './usePagination';
// import { PDFDocumentProxy } from 'pdfjs-dist';
// import html2canvas from 'html2canvas'
// import dayjs from 'dayjs';
// import ClipboardList from '../../components/ClipboardList';
// import AiResponse, { AiFeature } from '../../components/AiResponse';
// import AiFeatureMenu from '../../components/AiFeatureMenu';


// const SCALE_GAP = 0.1



// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url,
// ).toString();

// const pdfToMenuItemHandler = async (pdfItems?: any[], pdfDocument?: PDFDocumentProxy, parent?: any) => {
//   return Promise.all(pdfItems?.map(async ele => {
//     let key
//     try {
//       if (ele.dest instanceof Array) {
//         key = await pdfDocument?.getPageIndex?.(ele.dest?.find?.(ele2 => typeof ele2 === 'object' && Object.keys(ele2).some(ele3 => ['gen', 'num'].includes(ele3))))
//       } else {
//         const detail = (await pdfDocument?.getDestination(ele.dest))
//         key = await pdfDocument?.getPageIndex?.(detail?.[0])
//       }
//     } catch (error) {
//       console.log(ele)
//       console.log(error)
//     }
//     return {
//       label: ele.title,
//       key: `${key},${ele.title},${parent?.key}`,
//       children: ele.items?.length > 0 ? await pdfToMenuItemHandler(ele.items, pdfDocument, ele) : undefined
//     }
//   }))
// }

// export function mennuTarvesal(items: ItemType<MenuItemType>[], cb: (item: ItemType<MenuItemType>) => void) {
//   for (const item of items) {
//     cb(item)
//     if ((item as MenuItemType & { children?: ItemType<MenuItemType>[] }).children?.length > 0) {
//       mennuTarvesal((item as MenuItemType & { children?: ItemType<MenuItemType>[] }).children, cb)
//     }
//   }
// }

// export function getBookSeletedMenuKey(menu: ItemType<MenuItemType>[], target) {
//   let start: number = -1
//   let start_ref: ItemType<MenuItemType> = null
//   let tail: number = -1
//   let tail_ref: ItemType<MenuItemType> = null
//   mennuTarvesal(menu, (item) => {
//     if (typeof item.key === 'string') {
//       const temp = item.key.split(',').shift()
//       const thisPage = Number(temp)
//       if (target > thisPage) {
//         start = thisPage
//         start_ref = item
//         tail = -1
//       } else if (tail === -1 && target < thisPage && target > start) {
//         tail = thisPage
//         tail_ref = item
//       }
//     }
//   })
//   if (tail >= start && start != -1 && typeof start_ref.key === 'string') {
//     return [start_ref.key]
//   }
//   return []
// }


// export const Component = function PdfReader() {
//   const db_instance = useBookState(state => state.db_instance)
//   const [bookInfo, setBookInfo] = useState<BookItems | undefined>()
//   const list_ref = useRef(null)
//   const pdf_document_ref = useRef<HTMLDivElement>()
//   const PDFDocument = useRef<PDFDocumentProxy>(null)
//   const { t } = useTranslation()
//   const [switchOpen, setSwitchOpen] = useState<boolean>(true)
//   const navigate = useNavigate()
//   const [dragableDisabled, setDragableDisabled] = useState<boolean>(true)
//   const container_ref = useRef(null)
//   const [pdfOutline, setPdfOutline] = useState<MenuItemType[]>([])
//   const [counter, setCounter] = useState<number>(0)
//   const preCounter = usePrevious(counter)
//   const [readerUiWidth, setUiWidth] = useState()
//   const [readerUiHeight, setUiHeight] = useState()
//   const [isScaling, setIsScaling] = useState<boolean>()
//   const [translatorOpen, setTranslatorOpen] = useState<boolean>(false)
//   const [explainerOpen, setExplainerOpen] = useState<boolean>(false)
//   const [copiedText, setCopiedText] = useState<string>()
//   const [maxWidthPage, setMaxWidthPage] = useState<PDFPageProxy>()
//   const [loading, setLoading] = useState<boolean>(false)
//   const [cropOpen, setCropOpen] = useState<boolean>(false)
//   const [screenShot, setScreenShot] = useState<string>()
//   const cropRef = useRef()
//   const [isPageSelecting, setIsPageSelecting] = useState<boolean>(false)
//   const [resultImg, setResultImg] = useState<Uint8Array | null>()
//   const [isRecognizing, setIsRecognizing] = useState<boolean>(false)

//   const [clipboardListOpen, setClipboardListOpen] = useState<boolean>(false)
//   const [ratio, setRatio] = useState<number>()

//   const size = useSize(container_ref);
//   const { book_id } = useParams()
//   const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([])
//   const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])
//   const onPageLoadSuccess = useCallback((e: PDFPageProxy) => {
//     if (!maxWidthPage) {
//       setMaxWidthPage(e)
//     }
//     if ((e as any)?.originalWidth > (maxWidthPage as any)?.originalWidth) {
//       setMaxWidthPage(e)
//     }
//   }, [maxWidthPage])

//   const [ocrPending, setOcrPending] = useState<boolean>(false)

//   const [blob, setBlob] = useState<{ data: Uint8Array }>()
//   const [numPages, setNumPages] = useState<number>(0);

//   async function onDocumentLoadSuccess({ numPages, ...others }: { numPages: number, _transport: any }) {
//     PDFDocument.current = await others._transport.loadingTask.promise
//     setPdfOutline(await pdfToMenuItemHandler(await PDFDocument.current.getOutline() ?? [], PDFDocument.current))
//     setNumPages(numPages);
//   }

//   const {
//     scaleDown,
//     scaleUp,
//     scale,
//     pageNumber,
//     setPageNumber,
//     paginationInit,
//   } = usePagination({
//     numPages,
//     book_id,
//   })
//   const ThrottleScale = useThrottle(scale, { wait: 80 })
//   const {data: transformScale, runAsync: resetTransformScale} = useRequest(async (tempscale: number) => {
//     return tempscale ?? scale
//   }, {
//     refreshDeps: [scale]
//   })

//   // 修复缩放时定位
//   const scaleFixer = useCallback(() => {
//     if (list_ref.current) {
//       const top = ratio * renderListRowHeight * numPages
//       list_ref.current.scrollToPosition(top)
//     }
//   }, [ThrottleScale])
//   useEffect(() => {
//     scaleFixer()
//     resetTransformScale(1)
//   }, [ThrottleScale])

//   const { run: resizeHandler } = useThrottleFn((e: UIEvent) => {
//     if (list_ref.current && ratio) {
//       const top = ratio * renderListRowHeight * numPages
//       list_ref.current.scrollToPosition(top)
//     }
//   }, {
//     wait: 200
//   })
//   useEventListener('resize',(e) => {
//     resizeHandler(e)
//   } , {
//     target: window
//   })
//   // useEventListener('visibilitychange', resizeHandler, {
//   //   target: window
//   // })

//   useEffect(() => {
//     setCounter(pageNumber)
//   }, [pageNumber])
//   const renderPageHeight = useMemo(() => {
//     return 1 * ((size?.height ?? 20) - 20)
//   }, [size])

//   const destroy = useCallback(() => {
//     setBookInfo(undefined)
//     // list_ref.current = null
//     // pdf_document_ref.current = null
//     if (PDFDocument.current) {
//       PDFDocument.current.destroy()
//     }
//     // PDFDocument.current = null
//     setSwitchOpen(true)
//     setDragableDisabled(true)
//     setPdfOutline([])
//     setCounter(undefined)
//     setTranslatorOpen(false)
//     setExplainerOpen(false)
//     setCopiedText(undefined)
//     setMaxWidthPage(undefined)
//     setCropOpen(false)
//     setScreenShot(undefined)
//     // cropRef.current = null
//     setIsRecognizing(false)
//     setMenuSelectedKeys([])
//     setMenuOpenKeys([])
//     setBlob(undefined)
//     setNumPages(0)
//   }, [])

//   const init = useCallback(async () => {
//     try {
//       setLoading(true)
//       destroy()
//       await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
//         const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
//         const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
//         setBlob({ data: book_blob.blob })
//         setBookInfo(book_info)
//       })
//       paginationInit()
//     } catch (error) {

//     } finally {
//       setLoading(false)
//     }

//   }, [book_id])

//   const { clipboardList, clipboardList_update } = useBookState(state => state)

//   const copyHandler = useCallback(async () => {
//     try {
//       const res = await window.navigator.clipboard.readText()
//       if (!clipboardList.find(ele => ele.content === res)) {
//         clipboardList_update([{
//           create_date: +dayjs(),
//           content: res,
//           read: false,
//         }, ...clipboardList])
//       }
//       message.success(t('复制成功'))
//       setCopiedText(res)
//     } catch (error) {
//       console.error(error instanceof Error ? error.message : error)
//       message.error(t('粘贴失败'))
//     }
//   }, [clipboardList])

//   useEventListener('copy', copyHandler)

//   const shotCompleteHandler = useCallback(async () => {
//     try {
//       setIsRecognizing(true)
//       const text = await ImgToText(resultImg)
//       await navigator.clipboard.writeText(text)
//       message.success(t('读取文字成功，请在ai辅助功能里使用'))
//       await copyHandler()
//     } catch (error) {
//       message.error(error instanceof Error ? error.message : error)
//     } finally {
//       setIsRecognizing(false)
//       setCropOpen(false)
//       setIsPageSelecting(false)
//       setScreenShot(null)
//       setIsPageSelecting(false)
//       setResultImg(null)
//     }

//   }, [resultImg])

//   useKeyPress('alt.a', () => {
//     setScreenShot(null)
//     setIsPageSelecting(true)
//   })

//   const keydownHandler = useCallback((event) => {
//     if (event.ctrlKey) {
//       if (event.keyCode === 187 || event.key === '+') {
//         event.preventDefault();
//         scaleUp()

//       } else if (event.keyCode === 189 || event.key === '-') {
//         event.preventDefault();
//         scaleDown()
//       }
//     }
//   }, [ThrottleScale, pageNumber, numPages])

//   const { isPhone } = usePhone()

//   const dragHandler = useCallback((e: KeyboardEvent | MouseEvent) => {
//     switch (e.type) {
//       case 'keydown':
//         setDragableDisabled(false)
//         break;
//       case 'keyup':
//         setDragableDisabled(true)
//         break
//     }
//   }, [ThrottleScale, pageNumber, numPages])

//   useKeyPress('ctrl', dragHandler, {
//     events: ['keydown', 'keyup']
//   })

//   const scrollHandlerForDocument = (e) => {
//     if (e?.ctrlKey) {
//       e.preventDefault()
//     }
//   }

//   const scrollHandler = useCallback((event) => {
//     if (event.ctrlKey) {
//       event.preventDefault();
//       if (event.deltaY < 0) {
//         scaleUp()
//       } else {
//         scaleDown()
//       }
//     }
//   }, [ThrottleScale, pageNumber])

//   const { run: scrollToView } = useDebounceFn((number?: number) => {
//     list_ref.current?.scrollToRow(number ?? pageNumber)
//   }, {
//     wait: 100,
//   })
//   useEffect(scrollToView, [pageNumber, numPages])

//   useEffect(() => {
//     if (!book_id) {
//       return
//     }
//     setMenuSelectedKeys(getBookSeletedMenuKey(pdfOutline, counter))


//   }, [counter])

//   useEffect(() => {
//     if (!preCounter || !counter) {
//       return
//     }
//     const pageNum = String(counter || 1)
//     localStorage.setItem(`book_id:${book_id}`, pageNum)
//   }, [counter])


//   useEventListener('wheel', scrollHandler, {
//     target: pdf_document_ref
//   })
//   const [currentAiFeature, setCurrentAiFeature] = useState<AiFeature>()
  
//   // const modal_ref = useRef<{ start: () => Promise<void> }>()
//   // // 模拟选择文字事件
//   // useEventListener('mousedown', (e: MouseEvent) => {
//   //   const start = dayjs()
//   //   const selectHandler = (e: MouseEvent) => {
//   //     const end = dayjs()
//   //     if (end.diff(start, 'millisecond') < 500) {
//   //       container_ref.current?.removeEventListener('mouseup', selectHandler)
//   //       return
//   //     }

//   //     const text = window.getSelection().toString()
//   //     if (text?.length > 0) {
//   //       if (!currentAiFeature) {
//   //         // message.warning('请选择一种工具选择模式')
//   //         return
//   //       }
//   //       Modal.info({
//   //         title: text,
//   //         content: <AiResponse
//   //           ref={modal_ref}
//   //           type={currentAiFeature}
//   //           content={text}
//   //         ></AiResponse>,
//   //         maskClosable: true,
//   //         width: '80%',
//   //       })
//   //       setTimeout(() => {
//   //         console.log(modal_ref)
//   //         modal_ref?.current?.start?.()
//   //       }, 200);

//   //     }

//   //     container_ref.current?.removeEventListener('mouseup', selectHandler)
//   //   }

//   //   container_ref.current?.addEventListener?.('mouseup', selectHandler)
//   // }, {
//   //   target: container_ref
//   // })
//   useEffect(() => {
//     document.addEventListener('keydown', keydownHandler);
//     document.addEventListener('wheel', scrollHandlerForDocument, { passive: false })
//     return () => {
//       document.removeEventListener('keydown', keydownHandler)
//       document.removeEventListener('wheel', scrollHandlerForDocument)

//     }
//   }, [ThrottleScale, pageNumber, numPages])

//   const { run: cropHandler } = useDebounceFn(async (e: Cropper.CropEvent<HTMLImageElement>) => {
//     if (!cropRef.current) {
//       return
//     }
//     try {
//       ; (cropRef.current as any)?.cropper?.getCroppedCanvas()?.toBlob(async (data) => {
//         setResultImg(await readFileAsArrayBuffer(data))
//       })
//     } catch (error) {
//       message.error(error instanceof Error ? error.message : error)
//     }

//   }, {
//     wait: 300
//   })

//   useEffect(() => {
//     if (isPageSelecting && screenShot) {
//       setCropOpen(true)
//     }
//   }, [
//     screenShot,
//     isPageSelecting
//   ])

//   //初始化书籍
//   useEffect(() => {
//     if (!book_id) {
//       return
//     }
//     init()
//   }, [book_id])

//   const renderListWidth = useMemo(() => {
//     return ((maxWidthPage as any)?.originalWidth ?? 1) / ((maxWidthPage as any)?.originalHeight ?? 1) * renderPageHeight * scale
//   }, [maxWidthPage, renderPageHeight, scale])
//   const renderListHeight = useMemo(() => {
//     return size?.height
//   }, [size])
//   const renderListRowHeight = useMemo(() => {
//     return (renderPageHeight + 10) * ThrottleScale
//   }, [renderPageHeight, ThrottleScale])

//   // const renderAiFeature = useMemo(() => {
//   //   return [
//   //     {
//   //       "title": "普通模式",
//   //       "key": undefined,
//   //       icon: AlignCenterOutlined,
//   //     },,
//   //     {
//   //       "title": "摘要生成",
//   //       "key": "digest",
//   //       icon: SnippetsOutlined,
//   //     },
//   //     {
//   //       "title": "阐释并列举例子",
//   //       "key": "example",
//   //       icon: AlertOutlined,
//   //     },
//   //     {
//   //       "title": "生成练习题目",
//   //       "key": "exercises",
//   //       icon: FrownOutlined,
//   //     },
//   //     {
//   //       "title": "名词解释",
//   //       "key": "explain",
//   //       icon: RadarChartOutlined,
//   //     },
//   //     {
//   //       "title": "相关阅读推荐",
//   //       "key": "recommandation",
//   //       icon: ReadOutlined,
//   //     },
//   //     {
//   //       "title": "数据解读",
//   //       "key": "dataAnalysis",
//   //       icon: SoundOutlined,
//   //     }
//   //   ] as const
//   // }, [])

//   return (
//     <Spin
//       spinning={loading}
//     >
//       <Row
//         className={style.container}
//         gutter={[10, 16]}
//       >
//         {/* <FloatAiMenu
//           copiedText={copiedText}
//           translator={{
//             value: translatorOpen,
//             onCancel: setTranslatorOpen
//           }}
//           explainer={{
//             value: explainerOpen,
//             onCancel: setExplainerOpen
//           }}
//         ></FloatAiMenu> */}
//         <Col span={24}>
//           <Row
//             justify={'space-between'}
//             align={'middle'}
//           >
//             <Col>
//               <Space>

//                 <Breadcrumb
//                   items={[
//                     {
//                       title: <a type="link"><HomeOutlined /></a>,
//                       onClick: () => navigate('/')
//                     },
//                     {
//                       title: t('该书籍'),
//                     }
//                   ]}
//                 ></Breadcrumb>
//                 <Divider
//                   type="vertical"
//                 ></Divider>
//                 <Switch
//                   checkedChildren={t("目录（开）")}
//                   unCheckedChildren={t("目录（关）")}
//                   defaultChecked
//                   checked={switchOpen}
//                   onChange={setSwitchOpen}
//                 />
//               </Space>

//             </Col>
//             <Col>
//               <h3>{bookInfo?.name}</h3>
//             </Col>
//           </Row>
//         </Col>
//         <Col span={24}>
//           <Row
//             gutter={20}
//             wrap={false}
//             style={{
//               width: '100%'
//             }}
//           >
//             {
//               switchOpen ? <Col
//                 xxl={4}
//                 xl={4}
//                 lg={6}
//                 md={8}
//                 span={4}
//                 sm={4}
//                 xs={4}
//                 // sm={isPhone ? 24 : 8}
//                 // xs={isPhone ? 24 : 8}
//                 className={style.menu_container}
//               // style={{
//               //   height: isPhone ? '2.9rem' : undefined,
//               // }}
//               >
//                 <Menu
//                   // mode={isPhone ? 'horizontal' : undefined}
//                   items={pdfOutline}
//                   openKeys={menuOpenKeys}
//                   selectedKeys={menuSelectedKeys}
//                   onOpenChange={(e) => {
//                     setMenuOpenKeys(e)
//                   }}
//                   onSelect={(e) => {
//                     setMenuSelectedKeys(e.selectedKeys)
//                     setPageNumber(Number(e.selectedKeys?.[0]?.split?.(',')?.[0]))
//                   }}
//                 ></Menu>
//               </Col>
//                 : undefined
//             }

//             <Col
//               flex={'1 1'}
//             >
//               <div
//                 ref={container_ref}
//                 className={[
//                   style.pdf_container
//                 ].filter(val => val).join(' ')}
//                 id="pdf_container">

//                 <Draggable
//                   disabled={dragableDisabled}
//                 >
//                   <div
//                     style={{
//                       background: 'transparent',
//                     }}
//                   >
//                     <Document
//                       inputRef={pdf_document_ref}
//                       className={style.pdf_document}
//                       loading={<Spin spinning={true}><div
//                         style={{
//                           height: '100%',
//                           width: '100%',
//                           transform: `scale: ${transformScale}`
//                         }}
//                       ></div></Spin>}
//                       error={<Result
//                         status="error"
//                         title={t("书籍加载失败")}
//                       ></Result>}
//                       file={blob}
//                       onLoadSuccess={onDocumentLoadSuccess}
//                     >
//                       <List
//                         rowCount={numPages ?? 0}
//                         height={renderListHeight}
//                         onScroll={(e) => {
//                           setRatio(e.scrollTop / e.scrollHeight)
//                           setCounter(Math.round(e.scrollTop / renderListRowHeight))
//                         }}
//                         width={renderListWidth}
//                         rowHeight={renderListRowHeight}
//                         ref={list_ref}
//                         className={style.list_container}
//                         rowRenderer={({ key, style, index }) => {
//                           return (
//                             <div
//                               key={key}
//                               style={style}
//                             >
//                               <Page
//                                 className={[
//                                   style.pddf_pages_si,
//                                   stylecss.pdf_page_selecting
//                                 ].join(' ')}
//                                 height={renderPageHeight}
//                                 scale={ThrottleScale}
//                                 loading={<Spin spinning={true}><div
//                                   style={{
//                                     height: size.height
//                                   }}
//                                 ></div></Spin>}
//                                 error={<Result
//                                   status="error"
//                                   title={t("书籍加载失败")}
//                                 ></Result>}
//                                 pageNumber={index + 1}
//                                 onLoadSuccess={onPageLoadSuccess}
//                               ></Page>
//                             </div>

//                           )
//                         }}
//                       >
//                       </List>
//                     </Document>
//                   </div>
//                 </Draggable>
//                 <div className={style.scale_controller}>
//                   <Space
//                     size={'middle'}
//                   >
//                     <motion.div
//                       title={t("放大")}
//                       {...ANIMATION_STATIC}
//                       onClick={scaleUp}
//                     ><PlusCircleOutlined
//                       /></motion.div>
//                     <motion.div
//                       title={t("缩小")}
//                       {...ANIMATION_STATIC}
//                       onClick={scaleDown}
//                     ><MinusCircleOutlined /></motion.div>
//                     {
//                       ocrPending ? <motion.div
//                         {...ANIMATION_STATIC}
//                       >
//                         <LoadingOutlined />
//                       </motion.div> : <motion.div
//                         {...ANIMATION_STATIC}
//                         title={t("文字转图片")}
//                         onClick={async () => {
//                           setScreenShot(null)
//                           const c = await html2canvas(container_ref.current)
//                           setScreenShot(c.toDataURL('image/png', 1))
//                           setIsPageSelecting(true)
//                         }}
//                       >
//                         <CameraOutlined />
//                       </motion.div>
//                     }
//                     {/* <Divider
//                     type="vertical"
                    
//                     >

//                     </Divider> */}
//                     <AiFeatureMenu
//                     container_ref={container_ref}
//                     ></AiFeatureMenu>
//                     {/* {
//                       renderAiFeature.map(el => (
//                         <motion.div
//                           key={el.key}
//                           {...ANIMATION_STATIC}
//                         >
//                           <Tooltip
//                             title={t(el.title)}
//                           >
//                             <div
//                               onClick={() => setCurrentAiFeature(el.key)}
//                             ><el.icon
//                             style={{
//                               color: el.key === currentAiFeature ? '#80aa51' : undefined
//                             }}
//                               /></div>

//                           </Tooltip>
//                         </motion.div>
//                       ))
//                     } */}

//                   </Space>
//                 </div>
//                 <Row
//                   className={style.float_tooltip}
//                   align={'middle'}
//                 >
//                   <Col>
//                     <Space>
//                       <InputNumber
//                         bordered={false}
//                         value={counter}
//                         onChange={(e) => setCounter(e)}
//                         onBlur={(e) => {
//                           const target = Number(e.target?.value)
//                           if (Number.isNaN(target)) {
//                             return
//                           }
//                           setPageNumber(target)
//                         }}
//                         style={{
//                           width: '50px'
//                         }}
//                       ></InputNumber>
//                       <span>{`/ ${numPages ?? '0'}`}</span>
//                     </Space>
//                   </Col>

//                 </Row>
//               </div>


//             </Col>
//             {
//               clipboardListOpen
//                 ? <Col
//                   span={4}
//                 >
//                   <div
//                     style={{
//                       height: size?.height,
//                       // width: 400,
//                     }}
//                   >
//                     <Button
//                       type="link"
//                       icon={<RightOutlined />}
//                       danger
//                       onClick={() => setClipboardListOpen(false)}
//                     >Close</Button>
//                     <ClipboardList
//                       height={size?.height - 32}
//                     ></ClipboardList>
//                   </div>

//                 </Col>
//                 : <Col flex="0 1">
//                   <Badge
//                     count={clipboardList.filter(val => !val.read).length}
//                   >
//                     <div
//                       style={{
//                         height: size?.height,
//                         // width: 400,
//                       }}
//                       onClick={() => {
//                         setClipboardListOpen(true)
//                         clipboardList_update(clipboardList.map(ele => ({ ...ele, read: true })))
//                       }}
//                       className={style.clipboard_switch}
//                     >
//                       <LeftOutlined />
//                     </div>
//                   </Badge>

//                 </Col>
//             }


//           </Row>
//         </Col>
//         <Modal
//           style={{ top: 10 }}
//           open={cropOpen}
//           footer={null}
//           title={t('裁切图片')}
//           onCancel={() => {
//             setIsPageSelecting(false)
//             setScreenShot(null)
//             setCropOpen(false)
//           }}
//           width={'90vw'}
//         >
//           {/* <Divider></Divider> */}
//           <Row gutter={[12, 12]}>
//             <Col span={24}>
//               <Row justify={'end'}>
//                 <Col>
//                   <Space>
//                     <Button
//                       loading={isRecognizing}
//                       onClick={() => {
//                         shotCompleteHandler()
//                       }}
//                     >{t('完成')}</Button>
//                   </Space>
//                 </Col>
//               </Row>

//             </Col>
//             <Col span={24}>
//               <Cropper
//                 src={screenShot}
//                 style={{ height: 850, width: "100%" }}
//                 // Cropper.js options
//                 initialAspectRatio={16 / 9}
//                 guides={false}
//                 crop={cropHandler}
//                 ref={cropRef}
//               />
//             </Col>
//           </Row>


//         </Modal>
//       </Row>
//     </Spin>

//   )
// }
