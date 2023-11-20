import { useRequest } from 'ahooks';
import { Button } from 'antd'
import React from 'react'
import { useBookState } from '../../store';

interface ExportButtonProps extends React.RefAttributes<HTMLElement> {
    keys: Set<string | undefined>;
}

const download = async (obj: {
    blob?: Uint8Array,
    name?: string,
}) => {
    const url = URL.createObjectURL(new Blob([obj?.blob ?? '']))
    let a_tag: HTMLAnchorElement | null = document.createElement('a')
    a_tag.href = url
    a_tag.download = obj.name ?? '未命名'
    a_tag.click
    setTimeout(() => {
        URL.revokeObjectURL(url)
        a_tag = null
    }, 200);
}

export default function ExportButton(p: ExportButtonProps) {
    const db_instance = useBookState(state => state.db_instance)
    const { runAsync: exportFile, loading } = useRequest(async () => {
        await db_instance?.transaction('rw', db_instance.book_blob, db_instance.book_items, async () => {
            const records = await db_instance.book_items.where('hash').anyOf([...p.keys].filter(val => val)).toArray()
            for await (const record of records) {
                download({
                    blob: (await db_instance.book_blob.get(record.hash))?.blob,
                    name: record.name
                })
            }
        })
    }, {
        manual: true,
    })



    return (
        <Button
        type="link"
            onClick={exportFile}
            loading={loading}
        >导出按钮</Button>
    )
}
