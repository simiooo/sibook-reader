import { Button, Col, Menu, Result } from 'antd'
import { Row } from 'antd'
import { Key, useCallback, useEffect, useRef, useState } from 'react'
import style from './index.module.css'
import { useBookState } from '../../store'
import { useParams } from 'react-router-dom'
import ePub, { NavItem, Rendition } from 'epubjs'
import { Book } from 'epubjs'
import tailwindcss from './default.css?url'
import { BookItems } from '../../dbs/db'
import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import { createPortal } from 'react-dom'
import { Slider } from 'antd'
import { useEventListener, useThrottleFn } from 'ahooks'
import { Spin } from 'antd'
import { useKeyPress } from 'ahooks'
import { MenuItemType } from 'antd/es/menu/hooks/useItems'
import { RootObject, SubItem } from './type'

export default function index() {
  const db_instance = useBookState(state => state.db_instance)
  const navigate = useNavigate()
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const article_inited_ref = useRef<boolean>(false)
  const { book_id } = useParams()
  const [book, setBook] = useState<Book>()
  const [rendition, setRendition] = useState<Rendition>()
  const [bookLoading, setBookLoading] = useState<boolean>(false)
  const [isUserChangingLocation, setIsUserChangingLocation] = useState(false);
  const [error, setError] = useState<boolean>(false)


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

  // 设置事件监听
  useEffect(() => {
    rendition?.on('relocated', locationChangeByPercentage)
    rendition?.on('wheel', wheelHandler)
    rendition?.on('keyup', keyUpHandler)
    return () => {
      rendition?.off('relocated', locationChangeByPercentage)
      rendition?.off('wheel', wheelHandler)
      rendition?.off('keyup', keyUpHandler)
    }
  }, [rendition, currentLocation])

  // useKeyPress('uparrow', () => {
  //   rendition?.prev()
  // })
  // useKeyPress(40, () => {
  //   rendition?.next()
  // })

  // useEventListener('resize', () => {
  //   rendition?.flow()
  // })
  // useEventListener('wheel', wheelHandler)

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
            console.log(tempBook);

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
            title="加载图书失败"
            subTitle="发生异常，请联系开发者"
            extra={[
              <Button
                type="link"
                key="console"
                onClick={() => {
                  navigate('/')
                }}
              >
                回到书架
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
                <p><Breadcrumb
                  items={[
                    {
                      title: <a type="link"><HomeOutlined /></a>,
                      onClick: () => navigate('/')
                    },
                    {
                      title: '该书籍',
                      // onClick: () => reload()
                    }
                  ]}
                ></Breadcrumb></p>

              </Col>
              <Col>
                <p>{bookInfo?.name}</p>
              </Col>
            </Row>
          </Col>
          <Col
            span={24}
          >
            <Row wrap={false}>
              <Col
                xxl={4}
                xl={4}
                lg={6}
                md={8}
                span={4}
                sm={8}
                xs={8}
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
                      rendition?.display(e.key)
                    }}
                  ></Menu>
                </div>

              </Col>
              <Col
                sm={16}
                xs={16}
                xl={20}
                md={16}
                lg={18}
                span={20}>
                <div
                  id={'article'}
                  // ref={article_inited_ref}
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
