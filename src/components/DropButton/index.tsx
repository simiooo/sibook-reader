import { Button, message } from 'antd'
import React from 'react'
import { useBookState } from '../../store'
import { useRequest } from 'ahooks'
import { Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { requestor } from '../../utils/requestor';

interface DropButtonProps extends React.RefAttributes<HTMLElement> {
    keys: Set<string | undefined>;
}

export function useDropBook() {
    const db_instance = useBookState(state => state.db_instance)
    const currentIsland = useBookState(state => state.currentIsland)
    const {t} = useTranslation()
    const { runAsync: drop, loading } = useRequest(async (keys?: string[]) => {
        if (!keys) {
            return
        }
        try {
            if(!currentIsland) {
                throw Error(t('请选择岛屿'))
            }
            await db_instance?.transaction('rw', db_instance.book_items, db_instance.book_blob, async () => {
                await db_instance.book_items.where('hash').anyOf(keys).delete()
                await db_instance.book_blob.where('id').anyOf(keys).delete()
            })
            const res = await Promise.allSettled(keys.map(key => requestor({
                url: '/island/removeBookToIsland',
                data: {
                    bookId: key,
                    islandId: currentIsland,
                }
            })))
            for (const e of res) {
                if(e.status === 'fulfilled') {
                    message.success('删除成功')
                } else {
                    message.error("删除失败")
                }
            }
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
