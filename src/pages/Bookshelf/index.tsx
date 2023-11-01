import { Col } from "antd";
import { Row } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import BookNewButton from "../../components/BookNewButton";
import { Content } from "antd/es/layout/layout";
import { Layout } from "antd";
import { useBookState } from "../../store";
import BookItemList from "../../components/BookItemList";
import { useAsyncEffect, useRequest } from "ahooks";
import style from './index.module.css'
import { Spin } from "antd";

export default function index() {
    const db_instance = useBookState(state => state.db_instance)
    const workerLoading = useBookState(state => state.workerLoading)
    const [list, setList] = useState<any[]>([])
    const {runAsync, loading: listLoading} = useRequest(async () => {
        const res = await db_instance?.select({
            from: 'BookItems',
        })
        setList(res)
    })
    const loading = useMemo(() => {
        return listLoading || workerLoading
    }, [listLoading, workerLoading])


    return (
        <Layout>
            <Spin spinning={loading}>
            <Content className={style.content}>
                <Row gutter={[20, 40]}>
                    <Col span={24}>
                        <Row justify={'end'}>
                            <Col >
                                <BookNewButton
                                onChange={async () => {
                                    runAsync()
                                }}
                                ></BookNewButton>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[20, 20]}>
                            <Col span={24}>
                                <BookItemList
                                data={list}
                                ></BookItemList>
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
            
        </Layout>

    );
}
