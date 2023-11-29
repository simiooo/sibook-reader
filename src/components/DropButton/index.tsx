import { Button, message } from 'antd'
import React from 'react'
import { useBookState } from '../../store'
import { useRequest } from 'ahooks'
import { Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';

interface DropButtonProps extends React.RefAttributes<HTMLElement> {
    keys: Set<string | undefined>;
}

export function useDropBook() {
    const db_instance = useBookState(state => state.db_instance)
    const { runAsync: drop, loading } = useRequest(async (keys?: string[]) => {
        if (!keys) {
            return
        }
        try {
            await db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
                await db_instance.book_items.where('hash').anyOf(keys).delete()
                await db_instance.book_blob.where('id').anyOf(keys).delete()
            })
        } catch (error) {
            message.error(error instanceof Error ? error.message : error)
        }

    }, {
        manual: true
    })
    return {
        drop,
        loading,
    }
}

export default function DropButton(p: DropButtonProps) {
    const {t} = useTranslation()
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
            title={t("确认删除吗？")}
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

            >{t('删除')}</Button>
        </Popconfirm>

    )
}
