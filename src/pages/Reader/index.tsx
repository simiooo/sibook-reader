import { Button, Col, Divider, FloatButton, Menu, Result, Space, Switch, message } from 'antd'
import { Row } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import style from './index.module.css'
import { useBookState } from '../../store'
import { useParams } from 'react-router-dom'
import ePub, { Contents, NavItem, Rendition } from 'epubjs'
import { Book } from 'epubjs'
import tailwindcss from './default.css?url'
import { BookItems } from '../../dbs/db'
import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import { createPortal } from 'react-dom'
import { Slider } from 'antd'
import { useThrottleFn } from 'ahooks'
import { Spin } from 'antd'
import { useKeyPress } from 'ahooks'
import { MenuItemType } from 'antd/es/menu/hooks/useItems'
import FloatAiMenu from '../../components/FloatAiMenu'
import { useTranslation } from 'react-i18next'

export default function index() {
  const db_instance = useBookState(state => state.db_instance)
  const navigate = useNavigate()
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const container_ref = useRef<HTMLDivElement>(null)
  const article_inited_ref = useRef<boolean>(false)
  const { book_id } = useParams()
  const [book, setBook] = useState<Book>()
  const [rendition, setRendition] = useState<Rendition>()
  const [bookLoading, setBookLoading] = useState<boolean>(false)
  const [isUserChangingLocation, setIsUserChangingLocation] = useState(false);
  const {t} = useTranslation()
  const [error, setError] = useState<boolean>(false)
  const [epubHooks, setEpubHooks] = useState<Function[]>([])
  const [copiedText, setCopiedText] = useState<string>()
  const [floatOpen, setFloatOpen] = useState<boolean>(true)
  const [switchOpen, setSwitchOpen] = useState<boolean>(true)

  const [translatorOpen, setTranslatorOpen] = useState<boolean>(false)
  const [explainerOpen, setExplainerOpen] = useState<boolean>(false)


  const [menuItems, setMenuItems] = useState<MenuItemType[]>()
  const epubToMenuItemHandler = (epubItems?: (NavItem)[]) => {
    return epubItems?.map(ele => ({
      ...ele,
      label: ele.label,
      key: ele.href,
      value: ele.href,
      children: ele.subitems?.length > 0 ? epubToMenuItemHandler(ele.subitems) : undefined
    }))
  }
  const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([])
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])

  const [currentLocation, setCurrentLocation] = useState<number>(0)

  const locationChangeByPercentage = useCallback(() => {
    if (!rendition) {
      return
    }
    setIsUserChangingLocation(false)
    const startPercentage = book?.locations.percentageFromCfi(rendition.location.start.cfi) ?? 0
    const percentage = startPercentage
    setCurrentLocation(percentage * 100)
  }, [rendition, currentLocation])

  const { run: wheelHandler } = useThrottleFn((e) => {
    if ((e as any).wheelDeltaY > 0) {
      rendition?.prev()
    } else if ((e as any).wheelDeltaY < 0) {
      rendition?.next()
    }
  }, {
    wait: 200,
  })

  const { run: keyUpHandler } = useThrottleFn((e) => {
    if (e.keyCode === 38) {
      // 向上
      rendition?.prev()
    } else if (e.keyCode === 40) {
      // 向下
      rendition?.next()
    }
  }, {
    wait: 200
  })

  const copyHandlerFactory = (content: any) => {
    return async () => {
      try {
        const res = await content.window.navigator.clipboard.readText()
        message.success(t('复制成功'))
        setCopiedText(res)
      } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        message.error(t('粘贴失败'))
      }
    }
  }


  // useEffect(() => {
  //   rendition?.resize?.()
  // }, [switchOpen])

  const rendition_rendered_handler = useCallback(() => {
    
    const contents = rendition.getContents() as any as Contents[]
    // const handlerContainer: Function[] = []
    for (const content of contents) {
      let copyHandler = copyHandlerFactory(content)
      // handlerContainer.push(copyHandler)
      content.document.onwheel = wheelHandler
      content.document.oncopy = copyHandler
      copyHandler = null
    }
  }, [rendition])

  // 设置事件监听
  useEffect(() => {
    rendition?.on('relocated', locationChangeByPercentage)
    rendition?.on('rendered', rendition_rendered_handler)
    rendition?.on('keyup', keyUpHandler)
    return () => {
      rendition?.off('relocated', locationChangeByPercentage)
      rendition?.off('keyup', keyUpHandler)
      rendition?.on('rendered', rendition_rendered_handler)
    }
  }, [rendition, currentLocation])

  useKeyPress('uparrow', () => {
    rendition?.prev()
  }, {
    target: container_ref
  })
  useKeyPress(40, () => {
    rendition?.next()
  }, {
    target: container_ref
  })

  const init = useCallback(
    async (book?: Book, rendition?: Rendition) => {
      setBookLoading(true)
      return await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
        const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
        const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
        if (!(book_info && book_blob?.blob)) {
          return { book, rendition }
        }
        setBookInfo(book_info)
        const tempBook = ePub(book_blob.blob?.buffer, {})

        setBook(tempBook)
        tempBook.ready.then(() => {
          tempBook.locations.generate(512)
          if (!article_inited_ref.current) {
            article_inited_ref.current = true
            const tempRendition = tempBook.renderTo('article', { stylesheet: tailwindcss, width: "100%", height: "100%" })
            setRendition(tempRendition)
            const cfi = sessionStorage.getItem(`book_id:${book_id}`)

              ; (cfi && cfi !== '-1') ? tempRendition.display(cfi) : tempRendition.display()

            setMenuItems(epubToMenuItemHandler(tempBook?.navigation?.toc))
            return { book, rendition }
          } else {
            setBookLoading(false)
          }
        })
          .catch(err => {
            setError(true)
          })
          .finally(() => {
            setBookLoading(false)
          })

        return { book, rendition }
      })
    },
    [db_instance, book_id],
  )

  // const {book_id} = 
  // 通过进度条改位置
  useEffect(() => {
    if (!rendition) {
      return
    }
    if (!isUserChangingLocation) {
      return
    }
    const cfi = book?.locations.cfiFromPercentage(currentLocation / 100)
    rendition?.display(cfi)
    if (cfi && cfi !== '-1') {
      sessionStorage.setItem(`book_id:${book_id}`, cfi)
    }
  }, [currentLocation, rendition])

  useEffect(() => {
    if (!book_id) {
      return
    }
    const book: Book | undefined = undefined
    const rendition: Rendition | undefined = undefined

    init(book, rendition)
    return () => {
      rendition?.destroy?.()
      book?.destroy?.()
      setRendition(undefined)
      setBook(undefined)
    }
  }, [book_id])


  return (
    <Spin spinning={bookLoading}>
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

      {error
        ? <Row
          justify={'center'}
          align={'middle'}
          style={{
            height: '90vh'
          }}
        >
          <Result
            status="error"
            title={t("加载图书失败")}
            subTitle={t("发生异常，请联系开发者")}
            extra={[
              <Button
                type="link"
                key="console"
                onClick={() => {
                  navigate('/')
                }}
              >
                {t('回到书架')}
              </Button>
            ]}
          ></Result>
        </Row>
        : <Row
          className={style.container}>
          <Col
            className={style.toolbar}
            span={24}
          >
            <Row
              justify={'space-between'}
              align={'middle'}
            >
              <Col>
                <Space><Breadcrumb
                  items={[
                    {
                      title: <a type="link"><HomeOutlined /></a>,
                      onClick: () => navigate('/')
                    },
                    {
                      title: t('该书籍'),
                      // onClick: () => reload()
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
          <Col
            span={24}
          >
            <Row wrap={false}>
              {switchOpen ? <Col
                xxl={4}
                xl={4}
                lg={6}
                md={8}
                span={4}
                sm={8}
                xs={8}
                style={{
                  display: switchOpen ? undefined : 'none'
                }}
              >
                <div
                  className={style.menu_container}
                >
                  <Menu
                    items={menuItems}
                    openKeys={menuOpenKeys}
                    selectedKeys={menuSelectedKeys}
                    onOpenChange={(e) => {
                      setMenuOpenKeys(e)
                    }}
                    onSelect={(e) => {
                      setIsUserChangingLocation(false)
                      setMenuSelectedKeys(e.selectedKeys)
                      rendition?.display(e.key)
                    }}
                  ></Menu>
                </div>

              </Col>
            : undefined  
            }
              <Col
                flex="1 1"
                >
                <div
                  id={'article'}
                  ref={container_ref}
                  className={style.article}
                >

                </div>
              </Col>
            </Row>

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
                    setIsUserChangingLocation(true)
                    setCurrentLocation(v)
                  }}
                  value={currentLocation} />

              </Col>
            </Row></div>
            , document.body
          )}
        </Row>}
    </Spin>

  )
}
