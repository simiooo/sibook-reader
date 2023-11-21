import { Col, Menu, Row, Breadcrumb } from 'antd'
import { Document, Page } from 'react-pdf';
import React, { useCallback, useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useBookState } from '../../store';
import { BookItems } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';


export default function PdfReader() {
    const db_instance = useBookState(state => state.db_instance)
    const [bookInfo, setBookInfo] = useState<BookItems>()
    const navigate = useNavigate()

    const [blob, setBlob] = useState<Uint8Array>()
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    const init = useCallback(async () => {
        return await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
            const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
            const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
            setBlob(book_blob.blob)
            setBookInfo(book_info)
        })
    }, [])

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
            <Col span={24}>
                <div>
                    <Row>
                        <Col>
                            <Menu></Menu>
                        </Col>
                        <Col>
                            <div className="pdf_container" id="pdf_container">
                                <Document file="somefile.pdf" onLoadSuccess={onDocumentLoadSuccess}>
                                    <Page pageNumber={pageNumber} />
                                </Document>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Col>
            <Col span={24}></Col>
        </Row>
    )
}
