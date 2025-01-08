import { Alert, Button, Col, Divider, Dropdown, Modal, Result, Spin, message } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import Selecto from "react-selecto";
import style from './index.module.css'
import { Tooltip } from 'antd';
import { Tag } from 'antd';
import { BookBlob, BookItems, db } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';
import { MutableRefObject, forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Menu as CMenu, Item as CItem, useContextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";
import { useDebounceFn, useEventListener, useMap, useRequest, useThrottle, useThrottleFn } from 'ahooks';
import { AnimatePresence, LayoutGroup, motion, Reorder } from "framer-motion";
import { useTranslation } from 'react-i18next';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import BookPlaceholder from './BookPlaceholder';
import { Book } from '../../store/book.type';
import dayjs from 'dayjs';
import { requestor } from '../../utils/requestor';
import { useBookState } from '../../store';
import { HttpTask } from '../UploadContainer';
import { AxiosProgressEvent } from 'axios';
import { readFileAsArrayBuffer } from '../../dbs/createBook';
import { LoadingOutlined } from '@ant-design/icons';
import { backblazeIns } from '../../utils/backblaze';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { BookItem } from './BookItem';

export const tagMap = {
    'application/pdf': {
        type: 'PDF',
        color: '#222',
    },
    'application/epub+zip': {
        type: 'Epub',
        color: '#3498DB',
    }
}
// initial={{ opacity: 0, scale: 0.9 }}
//                                     animate={{ opacity: 1, scale: 1 }}
//                                     exit={{ opacity: 0, scale: 0.9 }}
//                                     transition={{
//                                         duration: 0.34,
//                                         ease: [0, 0.71, 0.2, 1.01],
//                                         type: 'spring'
//                                     }}
const cardAnimation = {
    initial: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
}

interface BookItemListProps {
    data?: (Book & { animationStatus: 'added' | 'visible' })[]
    selected?: Set<string | undefined>;
    onAdd?: (key?: string) => void;
    onRemove?: (key?: string) => void;
    loading?: boolean;
    contextmenuList?: any[];
    checkRef?: MutableRefObject<HTMLDivElement>;
    onContextmenuSelect?: (payload?: { type?: string }) => void
}
const BookItemList = forwardRef(function (p: BookItemListProps, ref: any) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const {
        modal,
        modalContextHolder,
        openHandler,
        bookBinaryLoading
    } = useBookDownload()
    const container_ref = useRef<HTMLDivElement>()
    const [intersectionContainer, {
        set: setInter,
        reset: resetInter
    }] = useMap<string, number>()
    const { show } = useContextMenu({
        id: 'you',
    });

    useEventListener('contextmenu', (e) => {
        e.preventDefault()
        show({ event: e })
    })



    const { run: openDebouncedHandler } = useDebounceFn(openHandler, {
        leading: true,
    })
    const { run: sortHandler } = useThrottleFn<DraggableEventHandler>((e, data) => {
        const ele = data.node as (HTMLDivElement | undefined)
        resetInter()
        if (!ele) {
            return
        }
        const bounding = ele.getBoundingClientRect()
        const els = [...document.getElementsByClassName('book_item')] as HTMLDivElement[]
        for (const el of els) {
            if (el?.dataset.hash === ele?.dataset.hash) {
                continue
            }
            const otherBounding = el.getBoundingClientRect()
            const isXIntersecting = Math.abs(bounding.x - otherBounding.x) < Math.min(bounding.width, otherBounding.width)
            const isYIntersecting = Math.abs(bounding.y - otherBounding.y) < Math.min(bounding.height, otherBounding.height)
            const square = Math.abs(bounding.x - otherBounding.x) * Math.abs(bounding.y - otherBounding.y)
            const isIntersecting = isXIntersecting && isYIntersecting
            if (isIntersecting) {
                setInter(el?.dataset?.hash, square)
            }

        }
    }, {
        wait: 200,

    })

    const renderList = useMemo(() => {
        return p.data ?? []

    }, [p.data, intersectionContainer])

    const { run: selectHandler } = useThrottleFn((e: any | { added: HTMLElement[], removed: HTMLElement[] }) => {
        if (e.inputEvent?.srcElement?.className === 'contexify_itemContent') {
            return
        }
        e.added.forEach((el: HTMLElement) => {
            p?.onAdd?.(el?.dataset?.hash)
        });
        e.removed.forEach((el: HTMLElement) => {
            p?.onRemove?.(el?.dataset?.hash);
        });
    }, {
        wait: 50
    })

    // useImperativeHandle(ref, () => {
    //     return {
    //     };
    //   }, []);

    return (
        <div
            ref={ref}
        >
            {modalContextHolder}
            <div
                className={style.container}
            >
                <CMenu
                    id="you"
                >
                    {
                        (p.contextmenuList ?? []).map(ele => (
                            <CItem
                                key={ele.key}
                                onClick={(e) => {
                                    e.event.stopPropagation()
                                    e.triggerEvent.stopPropagation()
                                    p.onContextmenuSelect?.({ type: ele?.value ?? ele?.key })
                                }}
                                id={ele.key}
                            >
                                {ele.label}
                            </CItem>
                        ))
                    }

                </CMenu>
                <Selecto
                    container={ref.current}
                    hitRate={5}
                    dragContainer={ref.current}
                    selectableTargets={[".book_item"]}
                    selectByClick={true}
                    selectFromInside={false}
                    continueSelect={false}

                    toggleContinueSelect={"shift"}
                    keyContainer={window}
                    onSelect={selectHandler}
                />

                <Row
                    justify={'start'}
                    gutter={[32, 26]}
                >
                    {/* <AnimatePresence> */}
                    {
                        (renderList ?? []).map((ele, index) => (
                            <BookItem
                                key={`${(ele?.objectId ?? ele?.objectName ?? index)}${index}`}
                                book={ele}
                                index={index}
                                selected={p.selected?.has?.(ele?.objectId)}
                                onDoubleClick={() => openDebouncedHandler(ele)}
                            />
                        ))
                    }
                    {/* </AnimatePresence> */}
                    {p?.loading && <LoadingOutlined style={{ fontSize: '24px' }} />}

                    <div
                        style={{
                            height: '24px',
                            width: '24px',
                        }}
                        ref={p?.checkRef}
                        className="visibleChecker"
                    ></div>

                </Row>





            </div>

        </div>


    )
}
)
export default BookItemList

export const useBookDownload = () => {
    const [modal, modalContextHolder] = Modal.useModal()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { tabs, tabs_add } = useBookState(state => state)
    const { uploadingTaskList, uploadingTaskList_update } = useBookState(state => ({
        uploadingTaskList: state.uploadingTaskList,
        uploadingTaskList_update: state.uploadingTaskList_update,
    }))

    const openBook = (cache: BookBlob, ele: Book) => {
        if (cache?.blob?.byteLength > 0 && dayjs(cache?.updatedAt).isAfter(ele?.uploadDate)) {
            // 本地获取
            if (ele?.objectType.startsWith('application/epub+zip')) {
                const pathname = `/reader/${ele.objectId}`
                tabs_add({
                    url: pathname,
                    label: ele.objectName,
                    closable: true
                })
                navigate(pathname)
            } else if (ele?.objectType.startsWith('application/pdf')) {
                const pathname = `/pdf_reader/${ele.objectId}`
                tabs_add({
                    url: pathname,
                    label: ele.objectName,
                    closable: true
                })
                navigate(pathname)
            } else {
                message.error(t('暂不支持'))
            }
        } else {
            message.error('Errored When open book')
        }
    }

    const { runAsync: openHandler, loading: bookBinaryLoading } = useRequest(async (ele: Book, options?: {
        openDisable?: boolean,
    }) => {
        try {
            const cache = await db.book_blob.get(ele.objectId)
            if (cache) {
                !options?.openDisable && openBook(cache, ele)
            } else {
                let fileIndex: number = -1
                // 云端获取
                if ((fileIndex = uploadingTaskList.findIndex(el => "httpMeta" in el ? el.httpMeta?.id === ele.objectId && el.httpMeta.type === 'download' : false)) > -1) {
                    const res = await modal.confirm({
                        title: '传输列表中已有该书籍，确定要重新下载吗？',
                    })
                    if (res) {
                        uploadingTaskList.splice(fileIndex, 1)
                        uploadingTaskList_update(uploadingTaskList)
                    }
                }
                const httpDownloadTask = (() => {
                    const httpDownloadTask: HttpTask = {
                        name: ele.objectName,
                        des: ele.objectName,
                        type: 'download',
                        unread: true,
                        httpMeta: {
                            type: 'download',
                            id: ele.objectId,
                            size: ele.objectSize,
                            current: 0,
                            error: false,
                            onDownloadProgress: function (e: AxiosProgressEvent) {
                                e
                            }
                        }
                    }
                    const progressHandler = (e: AxiosProgressEvent) => {
                        e.loaded
                        httpDownloadTask.httpMeta.current = e.loaded
                    }
                    httpDownloadTask.httpMeta.onDownloadProgress = progressHandler
                    return httpDownloadTask
                })()
                uploadingTaskList.unshift(httpDownloadTask)
                uploadingTaskList_update(uploadingTaskList)
                const exitInCos = await requestor<{ data: string }>({
                    url: "/backblaze/isExitedInStorage",
                    data: {
                        bookId: ele.objectId
                    }
                })
                const cancel = new AbortController()
                if (exitInCos.data.data === '1') {
                    httpDownloadTask.httpMeta.signal = cancel
                    const fileTask = await backblazeIns.getObject(`${ele.objectId}`, {
                        signal: cancel.signal,
                        onDownloadProgress: httpDownloadTask.httpMeta.onDownloadProgress
                    })
                    await db.book_blob.add({
                        id: ele.objectId,
                        blob: await readFileAsArrayBuffer(new File([fileTask?.data], ele.objectName)),
                        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    })
                    if (options?.openDisable) {
                        return
                    }
                    const cache = await db.book_blob.get(ele.objectId)
                    openBook(cache, ele)
                } else if (exitInCos.data.data === '0') {
                    httpDownloadTask.httpMeta.signal = cancel
                    const res = await requestor<Blob>({
                        url: "/island/getBookBinaryFromIsland",
                        responseType: 'blob',
                        timeout: 1000 * 60 * 5,
                        signal: cancel.signal,
                        onDownloadProgress: httpDownloadTask.httpMeta.onDownloadProgress,
                        data: {
                            bookId: ele.objectId
                        }
                    })

                    db.book_blob.add({
                        id: ele.objectId,
                        blob: await readFileAsArrayBuffer(new File([res.data], ele.objectName)),
                        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    }).then(() => {
                        if (options?.openDisable) {
                            return
                        }
                        if (ele?.objectType === 'application/epub+zip') {
                            const pathname = `/reader/${ele.objectId}`
                            tabs_add({
                                url: pathname,
                                label: ele.objectName,
                                closable: true
                            })
                            navigate(pathname)
                        } else if (ele?.objectType === 'application/pdf') {
                            const pathname = `/pdf_reader/${ele.objectId}`
                            tabs_add({
                                url: pathname,
                                label: ele.objectName,
                                closable: true
                            })
                            navigate(pathname)
                        } else {
                            message.error(t('暂不支持'))
                        }
                    })
                } else {
                    message.error('发生未知错误')
                }

            }
        } catch (error) {
            message.error(error.message)
        }

    }, {
        manual: true,
    })
    return {
        openHandler,
        bookBinaryLoading,
        modal,
        modalContextHolder
    }
} 