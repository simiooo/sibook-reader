import { Button, Col, Form, Input, Row, message } from 'antd'
import React from 'react'
import style from './index.module.css'
import { useRequest } from 'ahooks'
import { requestor } from '../../utils/requestor'

export interface LoginType{
    code?: number;
    expire?: string;
    token?: string;
}

export default function Login() {

    const {loading, runAsync} = useRequest(async (params: any) => {
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

    },{
        manual: true,
    })

  return (
            <Row
            align={'middle'}
            justify={'center'}
            style={{
                height: 'calc(100vh - 100px)',
            }}
            >
                <Col>
                    <div className={style.login_container}>
                        
                        <Row>
                            <Form
                            onFinish={(v) => runAsync(v)}
                            >
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
                                    <Form.Item
                                    wrapperCol={{
                                        // offset: 24,
                                    }}
                                    >
                                        <Button
                                        loading={loading}
                                        type="primary"
                                        htmlType='submit'
                                        >Sign In</Button>
                                    </Form.Item>
                                </Col>
                            </Form>
                        </Row>
                    </div>
                </Col>
            </Row>
        
  )
}
