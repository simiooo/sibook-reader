import { Card, Divider, List } from 'antd';
import React, { useEffect } from 'react'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// import {AutoSizer} from 'react-virtualized'
import { useBookState } from '../../store';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

export interface ClipboardType {
    read?: boolean;
    content?: string;
    create_date?: string | number;
}
export interface ClipboardListProps {
    height?: number;
}
export default function ClipboardList(p: ClipboardListProps) {
    const { t } = useTranslation()
    const { clipboardList, clipboardList_update } = useBookState(state => state)

    return (
        <AutoSizer>
            {({ height, width }) => (
                <List
                    style={{
                        width,
                        height,
                        overflow: 'auto'
                    }}
                    dataSource={clipboardList}
                    renderItem={(ele) => (
                        <div>
                            <div
                            >{ele.content}</div>
                            <Divider></Divider>
                        </div>
                    )}
                ></List>
            )}

        </AutoSizer>
    )
}
