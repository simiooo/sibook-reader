import { Card, Col, Flex, Row, Tag, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import * as PDFJS from 'pdfjs-dist';
import { Book } from '../../store/book.type';
import { tagMap } from './index';
import style from './index.module.css'
import { useState, useEffect } from 'react';
import { useBookState } from '../../store';
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

const cardAnimation = {
    initial: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
}

interface BookMetadata {
    title: string;
    author: string;
}

interface BookItemProps {
    book: Book & { animationStatus: 'added' | 'visible' };
    index: number;
    selected?: boolean;
    onDoubleClick: () => void;
}

export const BookItem = ({ book, index, selected, onDoubleClick }: BookItemProps) => {
    const [metadata, setMetadata] = useState<BookMetadata>({
        title: book.objectName || '',
        author: ''
    });

    const db = useBookState(state => state.db_instance)

    useEffect(() => {
        const parseMetadata = async () => {
            const blob = await db.book_blob.get(book.objectId)
            if (!blob) {
                return
            }
            if (book.objectType === 'application/pdf') {
                try {

                    const pdf = await PDFJS.getDocument(blob.blob).promise;
                    const metadata = await pdf.getMetadata();
                    setMetadata({
                        title: (metadata.info as any).Title || book.objectName || '',
                        author: (metadata.info as any).Author || ''
                    });
                } catch (error) {
                    console.error('Error parsing PDF metadata:', error);
                }
            } else if (book.objectType === 'application/epub+zip') {
                // 这里可以添加epub解析逻辑
                // 可以使用 epub.js 等库
            }
        };

        parseMetadata();
    }, [book.objectId, book.objectType]);

    return (
        <Col span={4} sm={8} xs={24} md={6} xl={4} xxl={4}>
            <motion.div
                key={`${(book?.objectId ?? book?.objectName ?? index)}${index}`}
                style={{
                    height: '18rem',
                    width: '100%',
                    originX: 0,
                    originY: 0
                }}
                initial={book?.animationStatus === 'added' ? 'initial' : false}
                animate={'visible'}
                variants={cardAnimation}
            >
                <Card
                    extra={<Tag color={tagMap[book?.objectType]?.color}>
                        {tagMap[book?.objectType]?.type}
                    </Tag>}
                    data-hash={book?.objectId}
                    className={`book_item ${selected ? style.book_item_active : ''}`}
                    onDoubleClick={onDoubleClick}
                    onTouchEnd={onDoubleClick}
                    title={<Tooltip title={metadata.title}>

                        <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                        }}>
                            {metadata.title.length > 50 ? metadata.title.slice(0, 50) + '...' : metadata.title}
                        </div>
                    </Tooltip>}
                >
                    <div
                    style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: 'break-all',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                    >{metadata.title}</div>
                    <div
                    style={{height: '.8rem'}}
                    ></div>
                    {metadata.author && <Tag
                    
                    >{metadata.author}</Tag>}

                </Card>
            </motion.div>
        </Col>
    );
}; 