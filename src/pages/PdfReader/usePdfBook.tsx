import { useNavigate, useParams } from "react-router-dom"
import { useBookState } from "../../store"
import { useRequest } from "ahooks"
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker?url'
import { BookBlob, BookItems } from "../../dbs/db"
import { useCallback, useEffect, useRef } from "react"
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api"
import { Button, Form, Input, Modal, Space, message } from "antd"
// import { PasswordException } from "pdfjs-dist"
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export function usePdfBook() {
    const [modal, contextHolder] = Modal.useModal()
    const db_instance = useBookState(state => state.db_instance)
    const { book_id } = useParams()
    

    useEffect(() => {
        if (pdfDocument) {
            pdfDocument.destroy()
        }
    }, [book_id])

    const cacheRef = useRef<{ document: PDFDocumentProxy }>({ document: undefined })
    const navigate = useNavigate()
    const { runAsync: getBook, data: book, loading: bookLoading } = useRequest(async () => {
        const book = await db_instance?.transaction('rw', 'book_items', 'book_blob', async () => {
            const book_info = await db_instance.book_items.where('hash').equals(book_id).first()
            const book_blob = await db_instance.book_blob.where('id').equals(book_id).first()
            return {
                ...book_info,
                blob: book_blob,
            }
        })
        return book
    }, {
        refreshDeps: [
            book_id
        ]
    })
    const [pdfPaswordForm] = Form.useForm()
    const { runAsync: getPdfDocument, data: pdfDocument, loading: pdfDocumentLoading } = useRequest(async () => {

        if (book?.blob) {
            if (cacheRef.current?.document) {
                cacheRef.current.document.destroy()
            }
            let copied = new Uint8Array(book?.blob.blob)
            try {
                const document = await pdfjs.getDocument(book?.blob.blob).promise
                cacheRef.current.document = document
                copied = null
                return document
            } catch (error) {
                if (error?.constructor?.name === 'PasswordException') {
                    const passwordModal = await modal.confirm({
                        title: '请输入密码',
                        onOk: async () => {
                            return await pdfPaswordForm.validateFields()
                        },
                        
                        content: <Form
                        form={pdfPaswordForm}
                        >
                            <Form.Item
                            label="密码"
                            name="password"
                            >
                                <Input
                                
                                type="password"
                                ></Input>
                            </Form.Item>
                        </Form> 
                    })
                    try {
                        const document = await pdfjs.getDocument({
                            data: copied,
                            password: pdfPaswordForm.getFieldValue(['password']),
                        }).promise
                        cacheRef.current.document = document
                        return document
                    } catch (error) {
                        message.error(error.message)
                        throw error
                    }
                    
                } else {
                    console.error(error)
                    modal.error({
                        title: '打开 PDF 失败',
                        async onOk() {
                            await modal.info({
                                title: '刷新页面吗?',
                                content: <div>
                                    
                                </div>,
                                footer: <Space>
                                <span></span>
                                <Button 
                                onClick={() => {
                                    location.reload()
                                }}
                                type="primary">Ok</Button>
                                <Button 
                                danger 
                                // type="link"
                                onClick={async () => {
                                    await db_instance.book_blob.where('id').equals(book_id).delete()
                                    navigate('/')
                                }}
                                >清理并回到首页</Button>
                            </Space>,
                                onCancel: () =>{
                                    // history
                                }
                            })
                        }
                    })
                }
            }

        }


    }, {
        refreshDeps: [
            book
        ]
    })

    const { data: meta, loading: metaLoading } = useRequest(async () => {
        if (!pdfDocument) {
            return
        }
        const [markInfo, metadata, outline, pageLabels, pageLayout, pageMode, viewerPreferences, numPages] = (await Promise.allSettled([
            pdfDocument.getMarkInfo(),
            pdfDocument.getMetadata(),
            pdfDocument.getOutline(),
            pdfDocument.getPageLabels(),
            pdfDocument.getPageLayout(),
            pdfDocument.getPageMode(),
            pdfDocument.getViewerPreferences(),
            pdfDocument.numPages
        ])).map(el => 'value' in el ? el.value : undefined)
        return {
            markInfo,
            metadata,
            outline,
            pageLabels,
            pageLayout,
            pageMode,
            viewerPreferences,
            numPages,
        }
    }, {
        refreshDeps: [
            pdfDocument
        ]
    })

    const destroy = useCallback(() => {
        pdfDocument.destroy()
    }, [pdfDocument])

    return [book, pdfDocument, meta, {
        pdfDocumentLoading,
        metaLoading, 
        bookLoading,

    }, { 
        destroy, 
        book_id, 
        contextHolder,
    }] as const
}