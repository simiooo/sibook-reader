import { Alert, Button, Col, Dropdown, message } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import Selecto from "react-selecto";
import style from './index.module.css'
import { Tooltip } from 'antd';
import { Tag } from 'antd';
import { BookItems } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Menu as CMenu, Item as CItem, useContextMenu } from 'react-contexify';
import "react-contexify/dist/ReactContexify.css";
import { useEventListener } from 'ahooks';
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';


interface BookItemListProps {
    data?: BookItems[]
    selected?: Set<string | undefined>;
    onAdd?: (key?: string) => void;
    onRemove?: (key?: string) => void;
    contextmenuList?: any[];
    onContextmenuSelect?: (payload?: { type?: string }) => void
}
export default function BookItemList(p: BookItemListProps) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const container_ref = useRef()
    const { show } = useContextMenu({
        id: 'you',
    });


    useEventListener('contextmenu', (e) => {
        e.preventDefault()
        show({ event: e })
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
                selectFromInside={true}
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
                    return <Col
                        // flex={'1 1'}
                        span={6}
                        sm={12}
                        xl={8}
                        xs={24}
                        key={ele?.hash ?? ele?.name ?? index}
                        xxl={6}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.5 + index * 0.25,
                                ease: [0, 0.71, 0.2, 1.01]
                            }}
                        >
                            <Card
                            data-hash={ele?.hash}
                            extra={<Tag color="#212121">{ele?.fileType}</Tag>}
                            className={`book_item ${p.selected?.has?.(ele?.hash) && style.book_item_active}`}
                            onDoubleClick={() => {
                                if (ele?.fileType === 'application/epub+zip') {
                                    navigate(`/reader/${ele.hash}`)
                                } else if (ele?.fileType === 'application/pdf') {
                                    navigate(`/pdf_reader/${ele.hash}`)
                                } else {
                                    message.error(t('暂不支持'))
                                }
                            }}
                            title={<Tooltip
                            >
                                {ele?.name}
                            </Tooltip>}
                        >{ele?.des}</Card>
                        </motion.div>
                        
                    </Col>
                })
            }
        </Row>
    )
}
