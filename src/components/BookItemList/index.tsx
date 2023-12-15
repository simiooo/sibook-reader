import { Alert, Button, Col, Dropdown, message } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import Selecto from "react-selecto";
import style from './index.module.css'
import { Tooltip } from 'antd';
import { Tag } from 'antd';
import { BookItems } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';
import { useCallback, useRef } from 'react';
import { Menu as CMenu, Item as CItem, useContextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";
import { useEventListener, useMap, useThrottle, useThrottleFn } from 'ahooks';
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import Draggable, { DraggableEventHandler } from 'react-draggable';

const tagMap = {
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
    data?: BookItems[]
    selected?: Set<string | undefined>;
    onAdd?: (key?: string) => void;
    onRemove?: (key?: string) => void;
    contextmenuList?: any[];
    onContextmenuSelect?: (payload?: { type?: string }) => void
}
export default function BookItemList(p: BookItemListProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const container_ref = useRef()
    const [intersectionContainer, {
        set: setInter,
        reset: resetInter
    }] = useMap<string, HTMLElement>()
    const { show } = useContextMenu({
        id: 'you',
    });


    useEventListener('contextmenu', (e) => {
        e.preventDefault()
        show({ event: e })
    })
    const openHandler = (ele) => {
        if (ele?.fileType === 'application/epub+zip') {
            navigate(`/reader/${ele.hash}`)
        } else if (ele?.fileType === 'application/pdf') {
            navigate(`/pdf_reader/${ele.hash}`)
        } else {
            message.error(t('暂不支持'))
        }
    }

    const { run: sortHandler } = useThrottleFn<DraggableEventHandler>((e, data) => {
        const ele = data.node as (HTMLDivElement | undefined)
        if (!ele) {
            return
        }
        const bounding = ele.getBoundingClientRect()
        const els = [...document.getElementsByClassName('book_item')] as HTMLDivElement[]
        for (const el of els) {
            if(el?.dataset.hash === ele?.dataset.hash) {
                continue
            }
            const otherBounding = el.getBoundingClientRect()
            const isXIntersecting = Math.abs(bounding.x - otherBounding.x) < Math.min(bounding.width, otherBounding.width)
            const isYIntersecting = Math.abs(bounding.y - otherBounding.y) < Math.min(bounding.height, otherBounding.height)
            const isIntersecting = isXIntersecting && isYIntersecting
            if (isIntersecting) {
                console.log({ isIntersecting, isXIntersecting, isYIntersecting, el })
            }

        }
    }, {
        wait: 200
    })

    return (
        <Row
            gutter={[32, 20]}
            className={style.container}
            justify={'start'}
            align={'top'}
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
                onSelect={(e: any | { added: HTMLElement[], removed: HTMLElement[] }) => {
                    if (e.inputEvent?.srcElement?.className === 'contexify_itemContent') {
                        return
                    }
                    e.added.forEach((el: HTMLElement) => {
                        p?.onAdd?.(el?.dataset?.hash)
                    });
                    e.removed.forEach((el: HTMLElement) => {
                        p?.onRemove?.(el?.dataset?.hash);
                    });
                }}
            />
            {
                (p.data.sort((pre, val) => val?.sort - pre.sort) ?? []).map((ele, index) => {
                    let title
                    let des
                    if (ele?.meta) {
                        if ('title' in ele?.meta) {
                            title = ele.meta.title
                            des = ele.meta.creator
                        } else {
                            title = ele.meta.Title
                            des = ele.meta.Author
                        }
                    }

                    return <Col
                        // flex={'1 1'}
                        span={6}
                        sm={12}
                        xl={8}
                        xs={24}
                        xxl={6}
                        key={ele?.hash ?? ele?.name ?? index}
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
                            <Draggable
                                onDrag={sortHandler}
                                key={ele?.hash ?? ele?.name ?? index}
                                defaultClassNameDragging={style.dragging}
                            ><Card
                                data-hash={ele?.hash}
                                extra={<Tag color={tagMap[ele?.fileType]?.color}>{tagMap[ele?.fileType]?.type}</Tag>}
                                className={`book_item ${p.selected?.has?.(ele?.hash) && style.book_item_active}`}
                                onDoubleClick={() => openHandler(ele)}
                                onTouchEnd={() => openHandler(ele)}
                                title={<Tooltip
                                >
                                    <Tooltip
                                        title={title ?? ele?.name}
                                    >
                                        {title ?? ele?.name}
                                    </Tooltip>

                                </Tooltip>}
                            >{des ?? ele?.name}</Card>
                            </Draggable>
                        </motion.div>

                    </Col>
                })
            }
        </Row>
    )
}
