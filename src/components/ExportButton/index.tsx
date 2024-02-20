import { useRequest } from 'ahooks';
import { Button, message } from 'antd'
import React from 'react'
import { useBookState } from '../../store';
import { useTranslation } from 'react-i18next';
import { Book } from '../../store/book.type';

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
    a_tag.click()
    setTimeout(() => {
        URL.revokeObjectURL(url)
        a_tag = null
    }, 200);
}

export function useExport() {
    const db_instance = useBookState(state => state.db_instance)
    const {t} = useTranslation()
    const { runAsync: exportFile, loading } = useRequest(async (record?: Book[]) => {
        if (!record) {
            return
        }
        try {
            await db_instance?.transaction('rw', db_instance.book_blob, db_instance.book_items, async () => {

                for await (const key of record ?? []) {
                    download({
                        blob: (await db_instance.book_blob.get(key?.id))?.blob,
                        name: key?.id
                    })
                }
            })
            message.success(t('下载成功'))
        } catch (error) {
            message.error(error instanceof Error ? error.message : error)
        }
        
    }, {
        manual: true,
    })
    return {
        exportFile,
        loading,
    }
}

export default function ExportButton(p: ExportButtonProps) {
    const db_instance = useBookState(state => state.db_instance)
    const {t} = useTranslation()
    const { runAsync: exportFile, loading } = useRequest(async () => {
        try {
            await db_instance?.transaction('rw', db_instance.book_blob, db_instance.book_items, async () => {
                const records = await db_instance.book_items.where('hash').anyOf([...p.keys].filter(val => val)).toArray()
            })
        } catch (error) {
        }
        
    }, {
        manual: true,
    })



    return (
        <Button
            type="link"
            onClick={exportFile}
            loading={loading}
        >{t('导出按钮')}</Button>
    )
}
