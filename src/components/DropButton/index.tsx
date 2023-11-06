import { Button } from 'antd'
import React from 'react'
import { useBookState } from '../../store'
import { useRequest } from 'ahooks'
import { Popconfirm } from 'antd';

interface DropButtonProps extends React.RefAttributes<HTMLElement> {
    keys: Set<string | undefined>;
}

export default function DropButton(p: DropButtonProps) {
    const db_instance = useBookState(state => state.db_instance)
    const { ...buttonProps } = p
    const { runAsync: drop, loading } = useRequest(async () => {
        await db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
            // for await(const key of p.keys) {

            // }
            await db_instance.book_items.delete([...p.keys])
            await db_instance.book_blob.delete([...p.keys])
        })
    }, {
        manual: true
    })
    return (
        <Popconfirm
        title="确认删除吗？"
        onConfirm={() => {
            drop()
        }}
        okType='danger'
        >

            <Button
                {...buttonProps}
                type="link"
                danger
                loading={loading}
                
            >删除</Button>
        </Popconfirm>

    )
}
