import { Col } from 'antd'
import { Row } from 'antd'
import React, { useEffect, useRef } from 'react'
import style from './index.module.css'
import { useBookState } from '../../store'
import { useLocation } from 'react-router-dom'
import { useAsyncEffect } from 'ahooks'
import { useParams } from 'react-router-dom'
import ePub from 'epubjs'
import { Book } from 'epubjs'
import antdcss from 'antd/dist/reset.css?inline'

export default function index() {
  const db_instance = useBookState(state => state.db_instance)
  const article_ref = useRef<HTMLDivElement>(null)
  const {book_id} = useParams()
  useAsyncEffect(async () => {
    if(!book_id) {
      return
    }
    let book: Book
    db_instance?.transaction( 'rw','book_items', 'book_blob',async () => {

      const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
      const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
      if(!(book_info && book_blob)) {
        return
      }
      book = ePub(book_blob.blob?.buffer, {})
      const rendition = book.renderTo('article', {stylesheet: '', width: "100%", height: "100%" })
  
      rendition.display()
    })
    return () => {
      book?.destroy?.()
    }
  }, [book_id])

  return (
    <Row className={style.container}>
      <Col
      className={style.toolbar}
      ></Col>
      <Col>
        <div
        id={'article'}
        ref={article_ref}
        className={style.article}
        >

        </div>
      </Col>
    </Row>
  )
}
