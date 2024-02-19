import React from 'react'
import style from './index.module.css'
import { Button, Col, Divider, Form, Input, Popconfirm, Row, Space, message } from 'antd';
import { useTranslation } from 'react-i18next'
import { useRequest } from 'ahooks'
import { requestor } from '../../utils/requestor'
import { useNavigate, useNavigation } from 'react-router-dom';
import { digestMessage } from '../../utils/sha515';
export default function Register() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    // const [form] = Form.useForm()
    const { runAsync: register, loading: registerLoading } = useRequest(async (v) => {
        try {
            const salt = (await digestMessage(Math.random(), 'SHA-256')).slice(0, 128)
            let payload = v ?? {}
            const res = await requestor({
                url: '/profile/register',
                data: {
                    ...payload,
                    password: await digestMessage(payload.password + salt),
                    confirmPassword: await digestMessage(payload.confirmPassword + salt),
                    salt,
                }
            })
            message.success(t('注册成功'))
            navigate('/login')
        } catch (error) {
            message.error('注册失败')
            console.error(error)
        }
        
    }, {
        manual: true
    })
    return (
        <div
            className={style.container}
        >
            <Row
                className={style.subContainer}
            >
                <Col
                    span={24}
                >
                    <h2>{t('注册')}</h2>
                    <Divider></Divider>
                    <Form
                        // form={form}
                        onFinish={(v) => {
                            register(v)
                        }}
                        name="userForm"
                        labelCol={{ span: 8 }}
                    >
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[
                                { required: true, message: 'Please input your username!' },
                                { min: 6, message: 'Username must be at least 6 characters' },
                                { max: 100, message: 'Username must not exceed 100 characters' },
                                { pattern: /^[a-zA-Z0-9]*$/, message: 'Username must be alphanumeric' },
                              ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { max: 512, message: 'Password must not exceed 512 characters' },
                                { pattern: /^[^\s]*$/, message: 'Password cannot include spaces' },
                              ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            name="confirmPassword"
                            rules={[
                                { required: true, message: 'Please confirm your password!' },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                  },
                                }),
                              ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Nickname"
                            name="nickname"
                            rules={[
                                { required: true, message: 'Please input your nickname!' },
                                { pattern: /^[^\s].*[^\s]$/, message: 'Nickname cannot start or end with a space' },
                              ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Description"
                            name="des"
                            rules={[
                                { max: 2048, message: 'Description must not exceed 2048 characters' },
                              ]}
                        >
                            <Input.TextArea />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { type: 'email', message: 'The input is not a valid E-mail!' },
                                { max: 2048, message: 'Email must not exceed 2048 characters' },
                              ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Phone Number"
                            name="phone"
                            rules={[
                                { max: 100, message: 'Phone number must not exceed 100 characters' },
                              ]}
                        >
                            <Input />
                        </Form.Item>
                        <div
                            className={style.button_container}
                        >
                            <Form.Item>
                                <Space>
                                    <Button 
                                    type="primary" 
                                    htmlType="submit"
                                    loading={registerLoading}
                                    >
                                        Submit
                                    </Button>
                                    <Popconfirm
                                        title={t('确定取消吗')}
                                        onConfirm={() => {
                                            navigate('/login')
                                        }}
                                    >
                                        <Button danger>
                                            Cancel
                                        </Button>
                                    </Popconfirm>

                                </Space>

                            </Form.Item>
                        </div>

                    </Form>
                </Col>
                <Col></Col>
            </Row>
        </div>
    )
}
