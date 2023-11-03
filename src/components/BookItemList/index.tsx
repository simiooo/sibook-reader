import { Col } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import React, { useState } from 'react'
import Selecto from "react-selecto";
import style from './index.module.css'
import { useSet } from 'ahooks';
import { Tooltip } from 'antd';
import { Tag } from 'antd';

interface BookItemListProps {
    data?: any[]
    // selected?: Set<string>;
}
export default function BookItemList(p: BookItemListProps) {
    const [selected, { add, remove }] = useSet<string | undefined>([])

    return (
        <Row
            gutter={[32, 20]}
        >
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
                onSelect={(e: {added:HTMLElement[], removed: HTMLElement[]}) => {
                    e.added.forEach(el => {
                        add(el?.dataset?.hash)
                    });
                    e.removed.forEach(el => {
                        remove(el?.dataset?.hash);
                    });
                }}
            />
            {
                (p.data ?? []).map((ele, index) => {
                    return <Col
                        flex={'1 1'}
                        span={6}
                        sm={12}
                        xl={8}
                        xs={24}
                        key={ele?.hash ?? ele?.name ?? index}
                        xxl={6}
                    >
                        <Card
                            data-hash={ele?.hash}
                            extra={<Tag color="#212121">{ele?.type}</Tag>}
                            className={`book_item ${selected.has(ele?.hash) && style.book_item_active}`}
                            title={<Tooltip
                                // title={ele?.name}
                            >
                                {ele?.name}
                            </Tooltip>}
                        >{ele?.des}</Card>
                    </Col>
                })
            }
        </Row>
    )
}
