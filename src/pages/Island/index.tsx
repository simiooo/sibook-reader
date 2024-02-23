import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { Button, Col, Form, Input, Modal, Row, message, Spin, Space, Select, SelectProps, Tag, Result, Avatar, Breadcrumb, Alert } from 'antd';
import classNames from 'classnames';
function OptionBuilder(data: [number, number, string, number][], activeId?: number) {


    return {

        dataset: [
            {
                dimensions: ['x', 'y', 'Island', "Id"],
                source: data,
            },
        ],
        visualMap: [
            {
                type: 'continuous',
                dimension: 0,
                min: 0,
                show:false,
                max: 1,
                inRange: {
                    symbol: [
                        'path://M150,100 Q130,100 130,120 Q130,140 150,140 Q170,140 170,120 Q170,100 150,100 Z M145,115 Q145,117 147,117 Q149,117 149,115 Q149,113 147,113 Q145,113 145,115 Z',
                        'path://M150,50 Q145,80 140,100 Q135,130 140,160 Q145,180 160,200 Q170,210 180,200 Q190,180 190,160 Q190,130 185,100 Q180,80 175,50 Q165,40 150,50 Z',
                        'path://M100,50 Q95,75 97,100 Q100,125 105,150 Q110,175 120,200 Q130,225 145,200 Q160,175 155,150 Q150,125 145,100 Q140,75 135,50 Q130,25 115,25 Q105,35 100,50 Z',
                        'path://M100,150 Q75,125 100,100 Q125,75 150,100 Q175,125 150,150 Q125,175 100,150 Z M125,125 Q120,120 125,115 Q130,110 135,115 Q140,120 135,125 Q130,130 125,125 Z',
                    ],
                    symbolSize: [20, 32]
                },
            }
        ],
        tooltip: {
            // show: false,
            position: 'top',
            formatter: function (params) {
                return params.data?.[2]
            }
        },
        
        xAxis: { show: false },
        yAxis: { show: false },
        series: [
            {
                type: 'scatter',
                symbolSize: 32,
                symbol: 'path://M150,100 Q130,100 130,120 Q130,140 150,140 Q170,140 170,120 Q170,100 150,100 Z M145,115 Q145,117 147,117 Q149,117 149,115 Q149,113 147,113 Q145,113 145,115 Z',
                color: '#F9E79F',
                itemStyle: {
                    borderColor: '#222',
                    borderWidth: 2,
                    color: (params) => {
                        return params?.data?.[3] === activeId ? '#A9DFBF' : '#F9E79F'
                    }
                },
            },
        ]
    };
}
type Island = Partial<{
    id: number,
    owner_id: string,
    owner_name?: string;
    created_at: string,
    updated_at: string,
    name: string,
    des: string,
    avatar: string;
    x?: number;
    y?: number;
}>
// interface IslandProps {
//     data: [number, number][];
// }
import style from './index.module.css'
import { useDebounceFn, useReactive, useRequest, useSize } from 'ahooks';
import { requestor } from '../../utils/requestor';
import { useBookState } from '../../store';
import { useTranslation } from 'react-i18next';
import { IslandMembers, UserSimply } from '../../store/user.type';
import { HomeOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const colors = ['#F9E79F', '#283593', '#196F3D']
export const Component = function Island() {
    const navigate = useNavigate();
    const { t } = useTranslation()
    const [islandCreateOpen, setIslandCreateOpen] = useState<boolean>(false)
    const { currentIsland, currentIsland_update } = useBookState(state => ({ currentIsland_update: state.currentIsland_update, currentIsland: state.currentIsland }))
    const [create_ref] = Form.useForm()
    const [memberOpen, setMemberOpen] = useState<boolean>(false)
    const [member_ref] = Form.useForm()
    const charts = useRef<HTMLDivElement>(null)
    const echarts_instance = useRef<echarts.ECharts>(null)
    const { runAsync: getSelfIslands, loading: getSelfIslandLoading, data: islands } = useRequest(async () => {
        try {
            const res = await requestor<{ data?: Island[] }>({
                url: '/island/islandListFromSelf',
            })
            return res?.data?.data ?? []
        } catch (error) {
            message.error(error.message)
        }

    })

    const { runAsync: queryMembers, loading: queryMembersLoading, data: members } = useRequest(async () => {
        if (!currentIsland) {
            return []
        }
        try {
            const res = await requestor<{ data?: IslandMembers[] }>({
                url: '/island/listIslandUser',
                data: {
                    id: currentIsland,
                }
            })
            return res.data?.data ?? []
        } catch (error) {
            return []
        }

    }, {
        refreshDeps: [currentIsland]
    })

    const { runAsync, loading: createLoading } = useRequest(async () => {
        try {
            const res = await requestor({
                url: '/island/createIsland',
                data: {
                    ...(create_ref.getFieldsValue() ?? {}),
                    x: Math.random(),
                    y: Math.random(),
                },
            })
            message.success(t('添加岛屿成功'))
        } catch (error) {
            message.error(t('添加岛屿失败'))
        } finally {
            setIslandCreateOpen(false)
        }

    }, {
        manual: true,
        onSuccess: async () => {
            await getSelfIslands()
            
        }
    })

    const { runAsync: searchUser, loading: searchUserLoading, data: searchUserData } = useRequest(async (nickname?: string) => {
        if (!nickname) {
            return []
        }
        try {
            const res = await requestor<{ data?: UserSimply[] }>({
                url: '/profile/v/queryUser',
                data: {
                    nickname,
                }
            })
            return res.data?.data ?? []
        } catch (error) {
            message.error(t('搜索失败'))
            return []
        }

    }, {
        manual: true,
    })
    const { run: debouceSearch } = useDebounceFn(searchUser, {
        wait: 400,
    })

    const { runAsync: addUserToIsland, loading: addUserToIslandLoading, data: addUserToIslandData } = useRequest(async (memberId?: string) => {
        try {
            if (!memberId) {
                throw Error('memberId不能为空')
            }
            await requestor({
                url: '/island/addUserToIsland',
                data: {
                    islandId: currentIsland,
                    memberId,
                }
            })
            setMemberOpen(false);
            message.success(t('添加成功'))
        } catch (error) {
            message.error(t('添加失败'))
        }
    }, {
        manual: true,
    })

    const renderOptions = useMemo(() => {
        return OptionBuilder((islands ?? []).map(el => [el.x ?? Math.random(), el.y ?? Math.random(), el.name, el.id]),currentIsland)
    }, [islands, currentIsland])
    useEffect(() => {
        if (echarts_instance.current) {
            echarts_instance.current.dispose()
            echarts_instance.current = null
        }
        echarts_instance.current = echarts.init(charts.current)
        echarts_instance.current.setOption(renderOptions)

        echarts_instance.current.on('click', function (params) {
            if (params.componentSubType === 'scatter' && params.componentType === 'series') {
                currentIsland_update(params.data?.[3])
            }
        })
        return () => {
            echarts_instance.current.dispose()
            echarts_instance.current = null
        }
    }, [renderOptions])
    const container_ref = useRef<HTMLDivElement>(null)
    const size = useSize(container_ref)

    useEffect(() => {
        echarts_instance.current?.resize?.({})
    }, [size])

    return (
        <div
            ref={container_ref}
            className={classNames(style.container)}>
            <Row>
                <Col
                    span={24}
                >
                    <Row
                        justify={'space-between'}
                        align={'middle'}
                    >
                        <Col>
                            <Breadcrumb
                                items={[
                                    {
                                        href: '',
                                        onClick: () => {
                                            navigate('/')
                                        },
                                        title: <HomeOutlined />,
                                    },
                                    {
                                        title: `${t("当前岛屿")}: ${(islands ?? [])?.find(el => el.id === currentIsland)?.name ?? '-'}`,
                                    },
                                ]}
                            />

                        </Col>
                        <Col>
                            <Space>
                                {!currentIsland ? <Alert
                                type='warning'
                                message={t('请选择岛屿')}
                                ></Alert> : undefined}
                                <Button
                                // disabled={!currentIsland}
                                    onClick={() => setIslandCreateOpen(true)}
                                >{t('新建岛屿')}</Button>
                                <Button
                                    disabled={!currentIsland}
                                    onClick={() => setMemberOpen(true)}
                                >{t('添加成员')}</Button>
                            </Space>
                        </Col>
                    </Row>


                </Col>
            </Row>
            <Row
                style={{
                    marginTop: '0.5rem',
                }}
            >
                <Col
                    style={{ height: '2rem' }}
                >
                    {(members ?? []).length > 0
                        ? <Avatar.Group
                            maxCount={7}
                        >
                            {(members ?? []).map((el, index) => (
                                <Avatar
                                    style={{
                                        background: colors[index % 3]
                                    }}
                                >{el.memberName?.[0]}</Avatar>
                            ))}

                        </Avatar.Group>
                        : <Tag
                        >
                            {t('暂无成员')}
                        </Tag>
                    }

                </Col>
            </Row>
            {/* <Spin
                indicator={<LoadingOutlined
                />}
                spinning={getSelfIslandLoading || queryMembersLoading || createLoading || searchUserLoading || addUserToIslandLoading}
            > */}
                <div
                    className={classNames(style.chart_container, style.island_container)}
                    ref={charts}></div>
            {/* </Spin> */}

            <Modal
                title={t("新建岛屿")}
                onCancel={() => setIslandCreateOpen(false)}
                onOk={() => {
                    runAsync()
                }}
                okButtonProps={{ loading: createLoading }}
                open={islandCreateOpen}
            >
                <Form
                    labelCol={{ sm: 8, xl: 6, md: 6 }}
                    form={create_ref}
                >
                    <Form.Item
                        label={'Name'}
                        name={'name'}
                    >
                        <Input></Input>
                    </Form.Item>
                    <Form.Item
                        label={'Description'}
                        name={'des'}
                    >
                        <Input></Input>
                    </Form.Item>
                    {/* <Form.Item
                    label={'Avatar'}
                    name={'avatar'}
                    >
                        <Input></Input>
                    </Form.Item> */}
                </Form>
            </Modal>
            <Modal
                onCancel={() => setMemberOpen(false)}
                onOk={() => {
                    addUserToIsland(member_ref.getFieldValue(['memberId']));

                    return
                }}
                okButtonProps={{
                    loading: addUserToIslandLoading
                }}
                open={memberOpen}
                title={t('成员')}
            >
                <Form
                    form={member_ref}
                >
                    <Form.Item
                        label={t("昵称")}
                        name="memberId"
                    >
                        <Select
                            options={(searchUserData ?? []).map(el => ({
                                label: el.nickname,
                                value: el.id,
                            }))}
                            showSearch
                            filterOption={false}
                            notFoundContent={
                                <div
                                    className={style.noFountMember}
                                >
                                    {searchUserLoading ? <Spin></Spin> : <Result title={t("没有找到用户")} status={"warning"} />}
                                </div>}
                            onSearch={(v) => debouceSearch(v)}
                            placeholder={t('请选择')}
                        ></Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
const tagRender: TagRender = (props) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return (
        <Tag
            color={'#3498DB'}
            onMouseDown={onPreventMouseDown}
            closable={closable}
            onClose={onClose}
            style={{ marginRight: 3 }}
        >
            {label}
        </Tag>
    );
};
type TagRender = SelectProps['tagRender'];