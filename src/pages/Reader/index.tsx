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

export default function index() {
  const db_instance = useBookState(state => state.db_instance)
  const navigate = useNavigate()
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const article_inited_ref = useRef<boolean>(false)
  const { book_id } = useParams()
  const [book, setBook] = useState<Book>()
  const [rendition, setRendition] = useState<Rendition>()


  const init = useCallback(
    async (book?: Book, rendition?: Rendition) => {
      return await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
        const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
        const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
        if (!(book_info && book_blob?.blob)) {
          return { book, rendition }
        }
        setBookInfo(book_info)
        const tempBook = ePub(book_blob.blob?.buffer, {})
        setBook(tempBook)
        if (!article_inited_ref.current) {
          article_inited_ref.current = true
          const tempRendition = tempBook.renderTo('article', { stylesheet: tailwindcss, width: "100%", height: "100%" })
          setRendition(tempRendition)
          tempRendition.display()
          return { book, rendition }
        }
        return { book, rendition }
      })
    },
    [db_instance],
  )


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
    }
  }, [book_id])

  return (
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
      
    </Row>
  )
}
