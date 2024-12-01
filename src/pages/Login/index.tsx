import { Button, Col, ConfigProvider, Divider, Flex, Form, Input, Row, Space, Spin, message } from 'antd'
import React, { useEffect, useState } from 'react'
import style from './index.module.css'
import { useRequest } from 'ahooks'
import { requestor } from '../../utils/requestor'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useBookState } from '../../store'
import { GoogleOutlined } from '@ant-design/icons'
type GoogleOAuthResponse = {
    authuser: string | null;
    code: string;
    prompt: string;
    scope: string;
};
// import { GoogleAuth } from 'google-auth-library'

export interface LoginType {
    code?: number;
    expire?: string;
    token?: string;
}

declare global {
    let google: any
}

export const Component = function Login() {
    const currentIsland_update = useBookState(state => state.currentIsland_update)
    const { loading: imgLoading, data: backgroundImg } = useRequest(async () => {
        const res = await requestor<Blob>({
            baseURL: '/',
            url: '/login_back.png',
            method: 'get',
            responseType: 'blob'
        })

        return URL.createObjectURL(res.data)
    })

    const [isGoogleInit, setIsGoogleInit] = useState<boolean>()

    const { data: googleClient, runAsync: googleInitHandler } = useRequest(async () => {

        const client = google.accounts.oauth2.initCodeClient({
            client_id: '51728316140-3cgt48unak6v5oaf93cgqeleardei2v5.apps.googleusercontent.com',
            scope: 'email profile',
            ux_mode: 'popup',
            callback: (response: GoogleOAuthResponse) => {
                // console.log(response)
                loginWithGoogle(response)
            },
        });
        return client
    }, {
        manual: true,
        
    })
    const { runAsync: loginWithGoogle, loading: loginWithGoogleLoading } = useRequest(async (data: GoogleOAuthResponse) => {
        try {
            const res = await requestor({
                url: "/auth/googleAuth",
                data
            })
            if (res.status !== 200) {

                throw Error(t('登录失败'))
            }
            localStorage.setItem('authorization', JSON.stringify(res.data))
            currentIsland_update(undefined)
            localStorage.removeItem('currentIsland')
            navigate('/')
        } catch (error) {
            message.error(t('登陆失败'))
        }

    }, {
        manual: true
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

                throw Error(t('登录失败'))
            }
            localStorage.setItem('authorization', JSON.stringify(res.data))
            currentIsland_update(undefined)
            localStorage.removeItem('currentIsland')
            navigate('/')
        } catch (error) {
            message.error(t('登陆失败'))
        }

    }, {
        manual: true,
        debounceWait: 1000,
        debounceLeading: true,
    })

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.className = "googleSdkScriptForSibook"
        script.onload = () => {
            console.log('------- Google Inited --------');
            googleInitHandler();
            setIsGoogleInit(true);
        };
        script.onerror = () => {
            console.log('err');
        };
        document.body.appendChild(script);

        // Cleanup function to remove the script when the component unmounts
        return () => {
            document.body.removeChild(script);
        };
    }, [])



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
                        <Col
                            sm={24}
                            xs={24}
                            md={12}
                            span={12}>
                            <img className={style.background} src={backgroundImg} alt="" />
                        </Col>
                        <Col
                            sm={24}
                            xs={24}
                            md={12}
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
                                    <Divider></Divider>
                                    <Col
                                        span={24}
                                    >
                                        <ConfigProvider
                                            theme={{
                                                token: {
                                                    borderRadius: 24,

                                                },
                                                components: {
                                                    Button: {
                                                        paddingBlock: 18,
                                                        paddingInline: 44,
                                                    }
                                                }
                                            }}
                                        >
                                            <Flex
                                                justify='center'
                                            >
                                                <Space
                                                    direction='vertical'

                                                >
                                                    <Button
                                                        disabled={!isGoogleInit}
                                                        loading={loginWithGoogleLoading}
                                                        onClick={() => {
                                                            googleClient.requestCode()
                                                        }}
                                                        icon={<GoogleOutlined />}
                                                    // type="primary"

                                                    >{t('登录')}</Button>
                                                </Space>
                                            </Flex>

                                        </ConfigProvider>

                                    </Col>
                                </Form>
                            </Row>
                        </Col>
                    </Row>

                </div>
            </Col>
        </Row> : <Spin>

        </Spin>

    )
}
