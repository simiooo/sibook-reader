import { Button, Col, Result, Space, Divider, Select, Input, Avatar, Popover, Switch, Form, Popconfirm, Tooltip } from 'antd';
import { Row } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyOutlined, DragOutlined, FileTextTwoTone, RedoOutlined, ShopOutlined, SmileOutlined, SortAscendingOutlined, SortDescendingOutlined, TranslationOutlined } from '@ant-design/icons'
import BookNewButton from "../../components/BookNewButton";
import { Content } from "antd/es/layout/layout";
import { Layout } from "antd";
import { useBookState } from "../../store";
import BookItemList from "../../components/BookItemList";
import { useInViewport, useRequest } from "ahooks";
import style from './index.module.css'
import { Spin } from "antd";
import { useDrop } from "ahooks";
import { useUpload } from "../../utils/useUpload";
import { message } from "antd";
import { useSet } from "ahooks";
import DropButton, { useDropBook } from "../../components/DropButton";
import { useExport } from "../../components/ExportButton";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import GPTSetting from "../../components/GPTSetting";
import { useTranslation } from 'react-i18next';
// import SyncModal from '../../components/SyncModal';
import { useNavigate } from 'react-router-dom';
import { requestor } from '../../utils/requestor';
import { Book } from '../../store/book.type';
import LeftMenu from '../../components/LeftMenu';
import dayjs from 'dayjs';


export const Component = function Bookshelf() {
    const { currentIsland, profile, isUserOnline } = useBookState(state => ({ currentIsland: state.currentIsland, profile: state.profile, isUserOnline: state.isUserOnline }))
    const containerRef = useRef<HTMLElement>(null)
    const visible_checker_ref = useRef<HTMLDivElement>()
    const [inViewport] = useInViewport(visible_checker_ref, {

    })
    const [init, setInit] = useState<boolean>(false)
    const { runAsync, loading: listLoading, data: listInfo } = useRequest(async (isInit: boolean = true) => {
        // const res = await db_instance?.book_items?.toArray()
        try {
            if (!currentIsland) {
                throw Error('请先登录')
            }
            const current = isInit ? 1 : (listInfo as any)?.current + 1 ?? 1
            const res = await requestor<{ data?: { total?: number, rows: Book[] } }>({
                url: '/island/getBookListFromIsland',
                data: {
                    islandId: currentIsland,
                    current,
                    pageSize: 20,
                    searchString: form.getFieldValue(['searchString']),
                    sortValue: form.getFieldValue(['sort']) ? '1' : '0',
                }
            })
            setInit(true)
            const map = new Map<string, boolean>()
            return isInit ? {
                total: res?.data?.data?.total,
                current,
                list: res.data?.data?.rows ?? []
            } as const
                : {
                    current,
                    total: res?.data?.data?.total,
                    list: [...(listInfo?.list ?? []), ...(res.data?.data?.rows ?? [])]
                    // .
                    // filter((val) => {
                    //     if (map.has(val?.objectId)) {
                    //         return false
                    //     } else {
                    //         map.set(val?.objectId, true)
                    //         return true
                    //     }
                    // })
                } as const
        } catch (error) {
            message.error(error?.response?.data?.message ?? error?.message)
            return {
                current: listInfo?.current ?? 1,
                total: listInfo?.total ?? 0,
                list: listInfo?.list ?? [],
            } as const
        }

    }, {
        refreshDeps: [currentIsland],
        debounceWait: 500,
    })
    useEffect(() => {
        if (inViewport && listInfo?.current >= 1 && listInfo?.list.length < listInfo?.total && !listLoading) {
            runAsync(false)
        }
    }, [inViewport, listInfo])
    const { upload, loading: uploadLoading } = useUpload({ onFinish: () => runAsync() })

    const { t, i18n } = useTranslation()

    // const visibleCheckerRef = useRef()

    const [dropModalOpen, setDropModalOpen] = useState<boolean>()

    const mainRef = useRef<HTMLElement>(null)
    useDrop(() => mainRef.current, {
        onFiles(e) {
            Promise.allSettled(e.map(file => upload({
                file, onError: (err => {
                    message.error(`${file.name} - ${err.message}`)
                })
            }))).finally(() => runAsync())
        },
        onDragEnter() {
            setDropModalOpen(true)
        },
        onDrop() {
            setDropModalOpen(false)
        },
        onDragLeave() {
            setDropModalOpen(false)
        }
    })

    const loading = useMemo(() => {
        return false || uploadLoading
    }, [uploadLoading])

    const [selected, { add, remove, reset }] = useSet<string | undefined>([])
    const { exportFile } = useExport()
    const { drop } = useDropBook()

    const contextmenuSelectedHandler = useCallback(async (type?: string) => {
        switch (type) {
            case 'drop':
                await drop(Array.from(selected))
                await runAsync()
                await reset()
                break;
            case 'export':
                await exportFile(listInfo?.list.filter(el => selected.has(el.objectId)))
                runAsync()
                break;
        }
    }, [selected])

    const contextmenuList = useMemo<ItemType[]>(() => {
        let result: any[] = []
        switch (selected.size) {
            case 0:
                result = [
                    {
                        label: t('请选择'),
                        value: 'undefined',
                        key: 'undefined',
                    }
                ]
                break;
            default:
                result = [

                    {
                        label: t('删除'),
                        value: 'drop',
                        key: 'drop',
                    },
                    {
                        label: t('导出'),
                        value: 'export',
                        key: 'export',
                    },
                ]
        }
        return result
    }, [selected])
    const [form] = Form.useForm()
    // const [islandOpen, setIslandOpen] = useState<boolean>(false)
    const navigate = useNavigate()
    const renderList = useMemo(() => {
        return listInfo?.list ?? []
    }, [listInfo?.list])



    return (
        <Row
            className={style.container}
        >
            <Col>
                <LeftMenu></LeftMenu>
            </Col>
            <Col flex={'1 1'}>
                <Layout
                    ref={mainRef}
                    className={style.main}
                >
                    <Spin spinning={loading}>
                        <div
                            className={style.content}
                        >
                            <Content>
                                <Row

                                    gutter={[20, 32]}>
                                    <Col>
                                    </Col>
                                    <Col span={24}>
                                        <Row justify={'space-between'}>
                                            <Col>
                                                <Form
                                                    initialValues={{ sort: true }}
                                                    form={form}
                                                    onFinish={() => {
                                                        runAsync()
                                                    }}
                                                >
                                                    <Space>
                                                        <Tooltip
                                                            title={'按上传时间排序'}
                                                        >
                                                            <><Form.Item
                                                                noStyle
                                                                name="sort"
                                                                valuePropName='checked'
                                                            >
                                                                <Switch
                                                                    onChange={form.submit}
                                                                    checkedChildren={
                                                                        <Space><span>由新到旧</span><SortDescendingOutlined /></Space>
                                                                    }
                                                                    unCheckedChildren={<Space><span>由旧到新</span><SortAscendingOutlined /></Space>}
                                                                ></Switch>
                                                            </Form.Item>
                                                            </>


                                                        </Tooltip>
                                                        <Form.Item
                                                            noStyle
                                                            name="searchString"
                                                        >
                                                            <Input
                                                                onChange={form.submit}
                                                                variant={'borderless'}
                                                                size='large'
                                                                placeholder={t('搜索书籍')}

                                                            ></Input>
                                                        </Form.Item>

                                                    </Space>
                                                </Form>


                                            </Col>
                                            <Col >
                                                <Space
                                                    wrap={true}
                                                >
                                                    <Button
                                                        type="link"
                                                        icon={<RedoOutlined />}
                                                        loading={listLoading}
                                                        onClick={() => {
                                                            runAsync()
                                                        }}
                                                    ></Button>
                                                    <BookNewButton
                                                        onChange={async () => {
                                                            runAsync()
                                                        }}

                                                    ></BookNewButton>



                                                </Space>

                                            </Col>

                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Row justify={'center'} gutter={[20, 20]}>
                                            <Col span={24}>
                                                {renderList?.length > 0 ? <BookItemList
                                                    loading={listLoading}
                                                    data={renderList}
                                                    selected={selected}
                                                    ref={containerRef}
                                                    checkRef={visible_checker_ref}
                                                    onAdd={add}
                                                    onRemove={remove}
                                                    contextmenuList={contextmenuList}
                                                    onContextmenuSelect={(e) => {
                                                        contextmenuSelectedHandler(e?.type)
                                                    }}
                                                ></BookItemList> : <div>
                                                    <Divider></Divider>
                                                    <Result
                                                        icon={<SmileOutlined
                                                            style={{ color: '#283593' }}
                                                        />}
                                                        title={
                                                            <Space
                                                                direction='vertical'
                                                                align='start'
                                                            >
                                                                <h2>{t("请上传书籍")}</h2>
                                                                <div>
                                                                    <Space
                                                                        direction='vertical'
                                                                        align="start"
                                                                        className={style.empty_content}
                                                                    >
                                                                        <span><DragOutlined /> {t('可拖拽到此处')}</span>
                                                                        <span><CopyOutlined /> {t('可粘贴文件在此处')}</span>
                                                                    </Space>
                                                                </div>
                                                            </Space>

                                                        }
                                                    />
                                                </div>}
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Row>
                                            <Col></Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Content>
                        </div>


                    </Spin>

                    {dropModalOpen && <div
                        className={style.upload_modal_container}
                    >
                        <div
                            className={style.upload_modal}
                        >
                            <FileTextTwoTone
                                twoToneColor={'#222'}
                                style={{
                                    fontSize: '10rem'
                                }}
                            />
                        </div>
                    </div>}
                </Layout>
            </Col>
            {
                !init && <Spin
                    fullscreen={true}
                    spinning={listLoading}
                    percent={'auto'}
                    size={'large'}
                ></Spin>
            }

        </Row>


    );
}
