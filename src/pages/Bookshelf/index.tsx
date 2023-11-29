import { Button, Col, Result, Space, Divider, Select } from 'antd';
import { Row } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import { CopyOutlined, DragOutlined, FileTextTwoTone, SmileOutlined, TranslationOutlined } from '@ant-design/icons'
import BookNewButton from "../../components/BookNewButton";
import { Content } from "antd/es/layout/layout";
import { Layout } from "antd";
import { useBookState } from "../../store";
import BookItemList from "../../components/BookItemList";
import { useRequest } from "ahooks";
import style from './index.module.css'
import { Spin } from "antd";
import { useDrop } from "ahooks";
import { Dropdown } from "antd";
import { useUpload } from "../../utils/useUpload";
import { message } from "antd";
import { useSet } from "ahooks";
import DropButton, { useDropBook } from "../../components/DropButton";
import ExportButton, { useExport } from "../../components/ExportButton";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { Alert } from "antd";
import GPTSetting from "../../components/GPTSetting";
import { useTranslation } from 'react-i18next';

export default function index() {
    const db_instance = useBookState(state => state.db_instance)
    const { upload, loading: uploadLoading } = useUpload()
    const [list, setList] = useState<any[]>([])
    const [aiOpen, setAiOpen] = useState<boolean>(false)
    const { runAsync, loading: listLoading } = useRequest(async () => {
        const res = await db_instance?.book_items?.toArray()
        setList(res ?? [])
    })
    const { t, i18n } = useTranslation()
    const [dropModalOpen, setDropModalOpen] = useState<boolean>()
    const containerRef = useRef<HTMLElement>(null)
    useDrop(() => containerRef.current, {
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
        return listLoading || uploadLoading
    }, [listLoading, uploadLoading])

    const [selected, { add, remove }] = useSet<string | undefined>([])
    const { exportFile } = useExport()
    const { drop } = useDropBook()

    const contextmenuSelectedHandler = useCallback(async (type?: string) => {
        switch (type) {
            case 'drop':
                await drop(Array.from(selected))
                runAsync()
                break;
            case 'export':
                await exportFile(Array.from(selected))
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



    return (
        <Layout
            ref={containerRef}
        >
            <GPTSetting
                open={aiOpen}
                onCancel={() => setAiOpen(false)}
                onOk={() => setAiOpen(false)}
            ></GPTSetting>
            <Spin spinning={loading}>

                <Content className={style.content}>
                    <Row gutter={[20, 32]}>
                        <Col span={24}>
                            <Row justify={'end'}>
                                <Col >
                                    <Space
                                    wrap={true}
                                    >
                                        <BookNewButton
                                            onChange={async () => {
                                                runAsync()
                                            }}
                                            
                                        ></BookNewButton>
                                        <Button
                                        size='small'
                                            type="link"
                                            onClick={() => { setAiOpen(true) }}
                                        >
                                            {t('ai 辅助设置')}
                                        </Button>
                                        <Select
                                            size='small'
                                            bordered={false}
                                            placeholder={
                                                <TranslationOutlined title={t('选择语言')} />}
                                            onChange={(e) => {
                                                i18n.changeLanguage(e)
                                            }}

                                            value={i18n.language}
                                            options={[
                                                {
                                                    label: <Space><TranslationOutlined /><span>Chinese</span></Space>,
                                                    value: 'zh',
                                                },
                                                {
                                                    label: <Space><TranslationOutlined /><span>Japanese</span> </Space>,
                                                    value: 'ja',
                                                },
                                                {
                                                    label: <Space><TranslationOutlined /><span>English</span> </Space>,
                                                    value: 'en',
                                                },
                                            ]}
                                        ></Select>
                                    </Space>

                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row justify={'center'} gutter={[20, 20]}>
                                <Col span={24}>
                                    {list?.length > 0 ? <BookItemList
                                        data={list}
                                        selected={selected}
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
                                            style={{color: '#283593'}}
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

    );
}
