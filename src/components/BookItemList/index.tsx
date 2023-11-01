import { Col } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import React, { useState } from 'react'
import Selecto from "react-selecto";
import style from './index.module.css'

interface BookItemListProps {
    data?: any[]
}
export default function BookItemList(p: BookItemListProps) {
    const [selected, setSelected] = useState<any[]>([])

    return (
        <Row
            gutter={[20, 20]}
        >
            <Selecto
                // The container to add a selection element
                container={document.body}
                hitRate={5}
                // The area to drag selection element (default: container)
                dragContainer={window}
                // Targets to select. You can register a queryselector or an Element.
                selectableTargets={[".book_item"]}
                // Whether to select by click (default: true)
                selectByClick={true}
                // Whether to select from the target inside (default: true)
                selectFromInside={true}
    
                continueSelect={false}
            
                toggleContinueSelect={"shift"}
                // The container for keydown and keyup events
                keyContainer={window}
                // The rate at which the target overlaps the drag area to be selected. (default: 100)

                onSelect={e => {
                    e.added.forEach(el => {
                        el.classList.add(style.book_item_active);
                    });
                    e.removed.forEach(el => {
                        el.classList.remove(style.book_item_active);
                    });
                }}
            />
            {
                (p.data ?? []).map((ele, index) => {
                    return <Col
                        flex={'1 1'}
                        span={4}
                        sm={12}
                        xl={6}
                        xs={24}
                        key={ele?.hash ?? ele?.name ?? index}
                        xxl={4}
                    >
                        <Card
                        data-hash={ele?.hash}
                        className={`book_item`}
                            hoverable
                            title={ele?.name}
                        >{ele?.des}</Card>
                    </Col>
                })
            }
        </Row>
    )
}
