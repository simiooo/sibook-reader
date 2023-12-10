import { Button, Form, Input, Modal, ModalProps, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useBookState } from '../../store'
import { useLocalStorageState } from 'ahooks'
import { useUpload } from '../../utils/useUpload'
import { bookshelfSync } from '../../utils/bookShelfSync'
import { useTranslation } from 'react-i18next'

interface SyncModalProps extends ModalProps {

}
export default function SyncModal(p: SyncModalProps) {
    const { ...others } = p
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const db_instance = useBookState(state => state.db_instance)
    const [islandName, setIslandName] = useLocalStorageState<string>('islandName')
    const { upload } = useUpload()
    const [loading, setLoading] = useState<boolean>(false)
    useEffect(() => {
        form.setFieldsValue({ name: islandName })
    }, [islandName])

    return (
        <Modal
            {...others}
            title={t('岛屿')}
            footer={null}
        >
            <Form
                form={form}
                onFinish={async (e) => {
                    setIslandName(e.name)
                    if (e.name) {
                        try {
                            setLoading(true)
                            const res = await bookshelfSync(e.name, db_instance)
                            await Promise.all(res.map(async file => upload({
                                file,
                            })))
                            others?.onOk?.(e)
                        } catch (error) {
                            message.error(error instanceof Error ? error.message : error)
                        } finally {
                            setLoading(false)
                        }
                    }
                }}
            >
                <Form.Item
                    label={t("岛屿名")}
                    name="name"
                    labelCol={{ span: 8 }}
                >
                    <Input
                        style={{
                            maxWidth: '300px'
                        }}
                    ></Input>
                </Form.Item>
                <Form.Item
                    wrapperCol={{ offset: 8 }}
                >
                    <Button
                        htmlType='submit'
                        loading={loading}
                    >{t('同步')}</Button>
                </Form.Item>
            </Form>
        </Modal>
    )
}
