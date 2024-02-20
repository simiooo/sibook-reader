import { Button, Col, Form, Input, Row, Space, message } from 'antd'
import React, { useState } from 'react'
import style from './index.module.css'
import { useRequest } from 'ahooks'
import { requestor } from '../../utils/requestor'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export interface LoginType {
    code?: number;
    expire?: string;
    token?: string;
}

export const Component = function Login() {
    const {loading: imgLoading, data: backgroundImg} = useRequest(async () =>{
        const res = await requestor<Blob>({
            baseURL: '/',
            url: '/login_back.png',
            method: 'get',
            responseType: 'blob'
        })
        
        return URL.createObjectURL(res.data)
    })
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const { loading, runAsync } = useRequest(async (params: any) => {
        try {
            const res = await requestor<LoginType>({
                url: '/login',
                data: {
                    username: params?.username,
                    password: params?.password,
                }
            })
            if (res.status !== 200) {
                message.error('登陆失败')
                return
            }
            localStorage.setItem('authorization', JSON.stringify(res.data))
            navigate('/')
        } catch (error) {
            message.error('登陆失败')
        }

    }, {
        manual: true,
    })

    return (
        backgroundImg ? <Row
            align={'middle'}
            justify={'center'}
            className={style.container}
        >
            <Col>
                <div className={style.login_container}>
                    <Row
                        gutter={[48, 24]}
                        align={'middle'}
                        className={style.login_internal_container}
                    >
                        <Col span={12}>
                            <img className={style.background} src={backgroundImg} alt="" />
                        </Col>
                        <Col
                            className={style.login_form_container}
                            span={12}>
                            <Row>
                                <Form
                                    onFinish={(v) => runAsync(v)}
                                >
                                    <h2>{t('登录')}</h2>
                                    <Col span={24}>
                                        <Form.Item
                                            label="Username"
                                            name="username"
                                            normalize={(v) => v?.trim()}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: 'Please input your username!'
                                                },
                                                {
                                                    pattern: /^[a-zA-Z0-9]{1,100}$/,
                                                    message: 'Please input a valid username!'
                                                }
                                            ]}
                                        >
                                            <Input></Input>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={"Password"}
                                            name="password"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: 'Please input your password!'
                                                },
                                                {
                                                    pattern: /^[a-zA-Z0-9]{1,30}$/,
                                                    message: 'Please input a valid password!'
                                                }
                                            ]}
                                        >
                                            <Input type="password"></Input>
                                        </Form.Item>
                                    </Col>
                                    <Col>
                                        <div
                                            className={style.buttons}
                                        >
                                            <Form.Item

                                            >
                                                <Space>
                                                    <Button
                                                        loading={loading}
                                                        type="primary"
                                                        htmlType='submit'
                                                    >{t('登录')}</Button>
                                                    <Button
                                                        onClick={() => {
                                                            navigate('/register')
                                                        }}
                                                    >{t('注册')}</Button>
                                                </Space>

                                            </Form.Item>
                                        </div>

                                    </Col>
                                </Form>
                            </Row>
                        </Col>
                    </Row>

                </div>
            </Col>
        </Row> : undefined

    )
}
