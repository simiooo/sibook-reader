import { Col, message } from 'antd'
import { Card } from 'antd'
import { Row } from 'antd'
import Selecto from "react-selecto";
import style from './index.module.css'
import { Tooltip } from 'antd';
import { Tag } from 'antd';
import { BookItems } from '../../dbs/db';
import { useNavigate } from 'react-router-dom';

interface BookItemListProps {
    data?: BookItems[]
    selected?: Set<string | undefined>;
    onAdd?: (key?: string) => void;
    onRemove?: (key?: string) => void;
}
export default function BookItemList(p: BookItemListProps) {
    const navigate = useNavigate()

    return (
        <Row
            gutter={[32, 20]}
            className={style.container}
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
                onSelect={(e: any | {added:HTMLElement[], removed: HTMLElement[]}) => {
                    e.added.forEach((el: HTMLElement) => {
                        p?.onAdd?.(el?.dataset?.hash)
                    });
                    e.removed.forEach((el: HTMLElement) => {
                        p?.onRemove?.(el?.dataset?.hash);
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
                            extra={<Tag color="#212121">{ele?.fileType}</Tag>}
                            className={`book_item ${p.selected?.has?.(ele?.hash) && style.book_item_active}`}
                            onDoubleClick={() => {
                                if(ele?.fileType === 'application/epub+zip') {
                                    navigate(`/reader/${ele.hash}`)
                                } else if( ele?.fileType === 'application/pdf') {
                                    navigate(`/pdf_reader/${ele.hash}`)
                                } else {
                                    message.error('暂不支持')
                                }
                                
                            }}
                            title={<Tooltip
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
