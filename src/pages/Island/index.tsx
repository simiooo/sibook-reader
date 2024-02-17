import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { Button, Col, Form, Input, Modal, Row, message } from 'antd';
import classNames from 'classnames';
const CLUSTER_COUNT = 6;
const COLOR_ALL = [
    '#37A2DA',
    '#e06343',
    '#37a354',
    '#b55dba',
    '#b5bd48',
    '#8378EA',
    '#96BFFF'
];
function OptionBuilder(data: [ number, number, string][]) {
    return {
        // dataset: [
        //     {
        //         source: [['Island', 'x', 'y'],...data]
        //     },
        // ],
        dataset: {
            dimensions: ['x', 'y', 'Island'],
            source: data,
        },
        tooltip: {
            position: 'top',
            formatter: '{b}'
        },
        grid: {
            left: 120
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: {
            type: 'scatter',
            symbolSize: 32,
            itemStyle: {
                borderColor: '#222',
                
            },
        }
    };
}
type Island = Partial<{
    id: number,
    owner_id: string,
    created_at: string,
    updated_at: string,
    name: string,
    des: string,
    avatar: string
}>
// interface IslandProps {
//     data: [number, number][];
// }
import style from './index.module.css'
import { useRequest } from 'ahooks';
import { requestor } from '../../utils/requestor';
export default function Island() {
    const [islandCreateOpen, setIslandCreateOpen] = useState<boolean>(false)
    const [create_ref] = Form.useForm()
    const charts = useRef<HTMLDivElement>(null)
    const echarts_instance = useRef<echarts.ECharts>(null)
    const {runAsync: getSelfIslands, loadiing: getSelfIslandLoading, data: islands} = useRequest(async () => {
        try {
            const res = await requestor<{data?: Island[]}>({
                url: '/island/islandListFromSelf',
            })
            return res?.data?.data ?? []
        } catch (error) {
            message.error(error.message)
        }
        
    })
    const {runAsync, loading: createLoading} = useRequest(async () => {
        try {
            const res = await requestor({
                url: '/island/createIsland',
                data: create_ref.getFieldsValue(),
            })
            message.success('添加岛屿成功')
        } catch (error) {
            message.error('添加岛屿失败')
        }
        
    }, {
        manual: true,
        onSuccess: () => {
            getSelfIslands()
        }
    })
    const renderOptions = useMemo(() => {
        return OptionBuilder((islands ?? []).map(el => [ Math.random(), Math.random(), el.name]))
    }, [islands])
    useEffect(() => {
        if(echarts_instance.current) {
            echarts_instance.current.dispose()
            echarts_instance.current = null
        }
        echarts_instance.current = echarts.init(charts.current)
        echarts_instance.current.setOption(renderOptions)
        return () => {
            echarts_instance.current.dispose()
            echarts_instance.current = null
        }
    }, [renderOptions])
    return (
        <div className={classNames(style.container)}>
            <Row>
                <Col>
                    <Button
                    onClick={() => setIslandCreateOpen(true)}
                    >新建岛屿</Button>
                </Col>
            </Row>
            <div 
            className={classNames(style.chart_container, style.island_container)}
            ref={charts}></div>
            <Modal
            title="新建岛屿"
            onCancel={() => setIslandCreateOpen(false)}
            onOk={() => {
                runAsync()
            }}
            okButtonProps={{loading: createLoading}}
            open={islandCreateOpen}
            >
                <Form
                labelCol={{sm: 8, xl: 6, md: 6}}
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
        </div>
    )
}
