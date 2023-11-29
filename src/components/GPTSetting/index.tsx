import { Button, Divider, Form, Input, Modal, ModalProps, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { useBookState } from '../../store'
import { AI_MODELS } from '../../utils/openaiModels'
import { useTranslation } from 'react-i18next'

export interface GPTSettingProps extends ModalProps {

}

export default function GPTSetting(p: GPTSettingProps) {
    const { ...modals } = p
    const {t} = useTranslation()
    const formValue = useBookState(state => ({
        openai_base_url: state.openai_base_url,
        openai_api_key: state.openai_api_key,
        openai_api_model: state.openai_api_model ?? 'gpt-3.5-turbo-1106'
    }))
    const openai_update = useBookState(state => state.openai_update)
    const [form] = Form.useForm()
    // useEffect(() => {
    //     form.setFieldsValue(formValue)
    // }, [formValue])

    return (
        <Modal
            title={t("gpt 配置")}
            {...modals}
            footer={null}
            width={'60vw'}
        >
            <Divider></Divider>
            <Form
                initialValues={formValue}
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                onFinish={(e) => {
                    openai_update(e)
                    p?.onOk?.(e)
                }}
            >
                <Form.Item
                    name="openai_base_url"
                    label={t("openai代理地址（可选）")}
                    rules={[
                        {
                            pattern: /^https?:\/\/.+$/,
                            message: t('输入的url不正确')
                        },
                    ]}
                >
                    <Input
                        style={{
                            maxWidth: '300px'
                        }}
                        placeholder={t('请输入基础url')}
                    ></Input>
                </Form.Item>
                <Form.Item
                    label={t("API密钥")}
                    name="openai_api_key"
                    required
                    rules={[
                        {
                            required: true,
                            message: t('请输入 API 密钥')
                        }
                    ]}
                >
                    <Input
                        style={{
                            maxWidth: '300px'
                        }}
                        type="password"
                        placeholder={t('请输入api密钥，该密钥存储在本地。')}
                    ></Input>
                </Form.Item>
                <Form.Item
                label={t("模型")}
                name="openai_api_model"
                >
                    <Select
                    style={{
                        maxWidth: '300px',
                    }}
                    options={AI_MODELS.map(ele => ({
                        label: ele.model,
                        value: ele.model,
                    }))}
                    ></Select>
                </Form.Item>
                <Form.Item
                wrapperCol={{offset: 8}}
                >
                    <Button
                        type='primary'
                        htmlType='submit'
                    >{t('保存')}</Button>
                </Form.Item>
            </Form>
        </Modal>
    )
}
