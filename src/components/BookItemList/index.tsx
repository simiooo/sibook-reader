import { Alert, Button, Col, Dropdown, Spin, message } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import Selecto from "react-selecto";
import style from './index.module.css'
import { Tooltip } from 'antd';
import { Tag } from 'antd';
import { BookItems, db } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Menu as CMenu, Item as CItem, useContextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";
import { useDebounceFn, useEventListener, useMap, useRequest, useThrottle, useThrottleFn } from 'ahooks';
import { motion } from "framer-motion";
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

interface BookItemListProps {
    data?: Book[]
    selected?: Set<string | undefined>;
    onAdd?: (key?: string) => void;
    onRemove?: (key?: string) => void;
    contextmenuList?: any[];
    onContextmenuSelect?: (payload?: { type?: string }) => void
}
export default function BookItemList(p: BookItemListProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {tabs, tabs_add} = useBookState(state => state)
    const {uploadingTaskList, uploadingTaskList_update} = useBookState(state => ({
        uploadingTaskList: state.uploadingTaskList,
        uploadingTaskList_update: state.uploadingTaskList_update,
    }))
    const container_ref = useRef()
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


    const { runAsync: openHandler, loading: bookBinaryLoading } = useRequest(async (ele: Book) => {
        try {
            
            const cache = await db.book_blob.get(ele.objectId)
            if (cache && dayjs(cache?.updatedAt).isAfter(ele?.uploadDate)) {
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
            } else {
                const httpUploadTask = (() => {
                    const httpUploadTask: HttpTask = {
                        name: ele.objectName,
                        des: ele.objectName,
                        type: 'download',
                        unread: true,
                        httpMeta: {
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
                        httpUploadTask.httpMeta.current = e.loaded
                    }
                    httpUploadTask.httpMeta.onDownloadProgress = progressHandler
                    return httpUploadTask
                })()
                uploadingTaskList.unshift(httpUploadTask)
                uploadingTaskList_update(uploadingTaskList)
                const res = await requestor<Blob>({
                    url: "/island/getBookBinaryFromIsland",
                    responseType: 'blob',
                    onDownloadProgress: httpUploadTask.httpMeta.onDownloadProgress,
                    data: {
                        bookId: ele.objectId
                    }
                })
                db.book_blob.add({
                    id: ele.objectId,
                    blob: await readFileAsArrayBuffer(new File([res.data], ele.objectName)),
                    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }).then(() => {
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
            }
        } catch (error) {
            message.error(error.message)
        }

    }, {
        manual: true,
    })
    const {run: openDebouncedHandler} = useDebounceFn(openHandler, {
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

    const {run: selectHandler} = useThrottleFn((e: any | { added: HTMLElement[], removed: HTMLElement[] }) => {
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

    return (
        
            <Row
                gutter={[16, 20]}
                className={style.container}
                justify={'center'}
                align={'top'}
                wrap={true}
                ref={container_ref}
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
                    container={document.body}
                    hitRate={5}
                    dragContainer={window}
                    selectableTargets={[".book_item"]}
                    selectByClick={true}
                    selectFromInside={false}
                    continueSelect={false}

                    toggleContinueSelect={"shift"}
                    keyContainer={window}
                    onSelect={selectHandler}
                />
                {
                    (renderList.sort((pre, val) => dayjs(pre.uploadDate).isBefore(val.uploadDate) ? -1 : 1) ?? []).map((ele, index) => {
                        if (ele.objectId === 'placeholder') {
                            <Col
                                key={ele?.objectId ?? ele?.objectName ?? index}
                            >
                                <BookPlaceholder></BookPlaceholder>
                            </Col>
                        } else {
                            let title
                            let des

                            return <Col
                                key={ele?.objectId}
                            >

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.34,
                                        delay: 0.5 + Math.min(index, 4) * 0.25,
                                        ease: [0, 0.71, 0.2, 1.01]
                                    }}
                                >
                                    <Card
                                    cover={<img></img>}
                                        data-hash={ele?.objectId}
                                        extra={<Tag color={tagMap[ele?.objectType]?.color}>{tagMap[ele?.objectType]?.type}</Tag>}
                                        className={`book_item ${p.selected?.has?.(ele?.objectId) && style.book_item_active}`}
                                        onDoubleClick={() => openDebouncedHandler(ele)}
                                        onTouchEnd={() => openDebouncedHandler(ele)}
                                        title={<Tooltip
                                        >
                                            <Tooltip
                                                title={title ?? ele?.objectName}
                                            >
                                                {title ?? ele?.objectName}
                                            </Tooltip>

                                        </Tooltip>}
                                    >{des ?? ele?.objectName}</Card>
                                </motion.div>

                            </Col>
                        }

                    })
                }
            </Row>

    )
}
