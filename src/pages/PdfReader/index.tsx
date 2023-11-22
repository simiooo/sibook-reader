import { Col, Menu, Row, Breadcrumb, Spin, Result, Slider } from 'antd'
import { Document, Page } from 'react-pdf';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useBookState } from '../../store';
import { BookItems } from '../../dbs/db';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import style from './index.module.css'
import { pdfjs } from 'react-pdf';
import worker from 'react-pdf/'
import { useKeyPress } from 'ahooks';
import { createPortal } from 'react-dom';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function PdfReader() {
  const db_instance = useBookState(state => state.db_instance)
  const [bookInfo, setBookInfo] = useState<BookItems>()
  const navigate = useNavigate()
  const { book_id } = useParams()
  const [pdf, setPdf] = useState()

  const [blob, setBlob] = useState<{ data: Uint8Array }>()
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  function onDocumentLoadSuccess({ numPages, ...others }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const renderProgress = useMemo(() => {
    return (pageNumber / numPages) * 100
  }, [
    pageNumber,
    numPages
  ])

  const init = useCallback(async () => {
    return await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
      const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
      const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
      console.log(book_blob)
      setBlob({ data: book_blob.blob })
      setBookInfo(book_info)
    })
  }, [])

  useKeyPress('uparrow', () => {
    if (pageNumber === 0) {
      return
    }
    setPageNumber(pageNumber - 1)
  })
  useKeyPress(40, () => {
    if (pageNumber === numPages) {
      return
    }
    setPageNumber(pageNumber + 1)

  })

  useEffect(() => {
    if (!book_id) {
      return
    }
    init()
    return () => {
    }
  }, [book_id])

  return (
    <Row>
      <Col span={24}>
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
                }
              ]}
            ></Breadcrumb></p>

          </Col>
          <Col>
            <p>{bookInfo?.name}</p>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
          <Row
          style={{
            width: '100%'
          }}
          >
            <Col
            xxl={4}
            xl={4}
            lg={6}
            md={8}
            span={4}
            sm={8}
            xs={8}
            >
              <Menu></Menu>
            </Col>
            <Col
            sm={16}
            xs={16}
            xl={20}
            md={16}
            lg={18}
            span={20}
            >
              <div className={style.pdf_container} id="pdf_container">
                <Document
                
                  className={style.pdf_document}
                  loading={<Spin spinning={true}></Spin>}
                  error={<Result
                    status="error"
                    title="书籍加载失败"
                  ></Result>}
                  file={blob} onLoadSuccess={onDocumentLoadSuccess}>
                  <Page 
                  width={1020}
                  pageNumber={pageNumber} />
                </Document>
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
                setPageNumber(Math.round(v / 100 * numPages))
              }}
              value={renderProgress} />

          </Col>
        </Row></div>
        , document.body
      )}
    </Row>
  )
}
