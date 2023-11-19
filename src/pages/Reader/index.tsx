import { Col } from 'antd'
import { Row } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import style from './index.module.css'
import { useBookState } from '../../store'
import { useLocation } from 'react-router-dom'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'react-router-dom'
import ePub, { Rendition } from 'epubjs'
import { Book } from 'epubjs'
import tailwindcss from './default.css?url'
import { BookItems } from '../../dbs/db'
import { Button } from 'antd'
import { Breadcrumb } from 'antd'
import { useNavigate } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import { Alert } from 'antd'
import { createPortal } from 'react-dom'
import { Slider } from 'antd'
import { useEventListener } from 'ahooks'
import { Spin } from 'antd'
import { useDebounce } from 'ahooks'
import Section from 'epubjs/types/section'
import { useKeyPress } from 'ahooks'
import { useThrottle } from 'ahooks'

export default function index() {
  const db_instance = useBookState(state => state.db_instance)
  const navigate = useNavigate()
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const article_inited_ref = useRef<boolean>(false)
  const { book_id } = useParams()
  const [book, setBook] = useState<Book>()
  const [rendition, setRendition] = useState<Rendition>()
  const [bookLoading, setBookLoading] = useState<boolean>(false)

  const [currentLocation, setCurrentLocation] = useState<number>(0)

  const locationChangeByPercentage = useCallback((e) => {
    if (!rendition) {
      return
    }
    const startPercentage = book?.locations.percentageFromCfi(rendition.location.start.cfi) ?? 0
    // const endPercentage = book?.locations.percentageFromCfi(rendition.location.end.cfi) ?? 0
    // const percentage = (startPercentage + endPercentage) / 2
    const percentage = startPercentage
    
    if (currentLocation !== 0 || percentage * 100 !== currentLocation) {
      setCurrentLocation(percentage * 100)
    }
  }, [rendition, currentLocation])

  // 设置事件监听
  useEffect(() => {
    rendition?.on('relocated', locationChangeByPercentage)
    return () => {
      rendition?.off('relocated', locationChangeByPercentage)
    }
  }, [rendition, currentLocation])

  useKeyPress('uparrow', () => {
    rendition?.prev()
  }, {
    // target: document.documentElement
  })
  useKeyPress(40, () => {
    rendition?.next()
  }, {
    // target: document.documentElement
  })

  useEventListener('wheel', (e) => {
    if(e.wheelDeltaY > 0) {
      rendition?.prev()
      
    } else if(e.wheelDeltaY < 0) {
      rendition?.next()
    }
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
        })
          .finally(() => {
            setBookLoading(false)
          })
        if (!article_inited_ref.current) {
          article_inited_ref.current = true
          const tempRendition = tempBook.renderTo('article', { stylesheet: tailwindcss, width: "100%", height: "100%" })
          setRendition(tempRendition)
          const cfi = sessionStorage.getItem(`book_id:${book_id}`)
          console.log(cfi);
          
          cfi ? tempRendition.display(cfi) : tempRendition.display()

          // setSections(tempBook.spine.get('spineItems'))
          return { book, rendition }
        } else {
          setBookLoading(false)
        }
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
    const cfi = book?.locations.cfiFromPercentage(currentLocation / 100)
    rendition?.display(cfi)
    if(cfi && cfi !== '-1') {
      sessionStorage.setItem(`book_id:${book_id}`, cfi)
    }
  }, [currentLocation, rendition])

  useEffect(() => {
    if (!book_id) {
      return
    }
    let book: Book | undefined = undefined
    let rendition: Rendition | undefined = undefined

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
      <Row

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
                    href: '',
                    title: <HomeOutlined />,
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
          <div
            id={'article'}
            // ref={article_inited_ref}
            className={style.article}
          >

          </div>
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
                  
                  setCurrentLocation(v)
                }}
                value={currentLocation} />

            </Col>
          </Row></div>
          , document.body
        )}
      </Row>
    </Spin>

  )
}
