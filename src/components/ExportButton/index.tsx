import { useRequest } from 'ahooks';
import { Button, message } from 'antd'
import React from 'react'
import { useBookState } from '../../store';
import { useTranslation } from 'react-i18next';
import { Book } from '../../store/book.type';
import { useBookDownload } from '../BookItemList';

interface ExportButtonProps extends React.RefAttributes<HTMLElement> {
    // keys: Set<string | undefined>;
    books?: Book[];
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
    const {
        modal,
        modalContextHolder,
        openHandler,
        bookBinaryLoading
    } = useBookDownload()
    const db_instance = useBookState(state => state.db_instance)
    const {t} = useTranslation()
    const { runAsync: exportFile, loading } = useRequest(async (record?: Book[]) => {
        if (!record) {
            return
        }
        try {
            for await (const book of record ?? []) {
                await openHandler(book, {openDisable: true})
                download({
                    blob: (await db_instance.book_blob.get(book?.objectId))?.blob,
                    name: book?.objectName
                })
            }
            await db_instance?.transaction('rw', db_instance.book_blob, db_instance.book_items, async () => {

                
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
    const {
        modal,
        modalContextHolder,
        openHandler,
        bookBinaryLoading
    } = useBookDownload()
    const db_instance = useBookState(state => state.db_instance)
    const {t} = useTranslation()
    const { runAsync: exportFile, loading } = useRequest(async () => {
        try {
            for await (const book of (p?.books ?? [])) {
                await openHandler(book, {openDisable: true})
            }
            await db_instance?.transaction('rw', db_instance.book_blob, db_instance.book_items, async () => {
                const records = await db_instance.book_items.where('hash').anyOf([...(p?.books ?? []).map(el => el.objectId)].filter(val => val)).toArray()
            })
        } catch (error) {
            console.error(error)
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
