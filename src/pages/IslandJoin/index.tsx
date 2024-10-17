import { Avatar, Button, Col, Divider, Popconfirm, Row, Skeleton, Space, Spin, Tag, Tooltip } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUserInvitedToIsland } from '../../utils/island'
import { useSearchParams } from 'react-router-dom'
import IslandIcon from '../../components/Icons/IslandIcon'
import styles from './index.module.css'
import { motion } from 'framer-motion'

const colors = ['#F9E79F', '#283593', '#196F3D']

export function Component() {
    const { t } = useTranslation()

    const { islandInfo, getIslandInfo, join, loading, joinLoading } = useUserInvitedToIsland()
    return (
        <div
            className={styles.container}
        >
            <div
                style={{
                    height: '9rem'
                }}
            ></div>
            {loading ? <Spin
                spinning={loading}
            >
                
            </Spin> :
            <Row gutter={[24, 24]}>

                <Col span={24}>
                    <h1>
                        <Space>
                            <IslandIcon></IslandIcon>
                            {islandInfo?.island?.name}
                        </Space>
                    </h1>
                </Col>
                <Col>{t('岛主人')} : <span>{islandInfo?.island?.owner_name ?? '-'}</span></Col>
                <Col span={24}>
                    {(islandInfo?.member ?? []).length > 0
                        ? <Avatar.Group

                            max={{ count: 7 }}
                        >
                            {(islandInfo?.member ?? []).map((el, index) => (
                                <Tooltip
                                    title={el.memberName}
                                    key={el.memberId + el.memberName}
                                >
                                    <motion.div

                                        initial={{
                                            y: -6,
                                            opacity: 0,
                                        }}
                                        transition={{
                                            delay: index * 0.01,
                                            duration: .5,
                                            times: 20,
                                            type: "spring",
                                            damping: 10,
                                            stiffness: 100,
                                        }}
                                        animate={{
                                            y: 0,
                                            opacity: 1
                                        }}
                                    >
                                        <Avatar

                                            style={{
                                                background: colors[index % 3]
                                            }}
                                        >{el.memberName?.[0]}</Avatar>
                                    </motion.div>

                                </Tooltip>

                            ))}

                        </Avatar.Group>
                        : <Tag
                        >
                            {t('暂无成员')}
                        </Tag>
                    }
                </Col>
                <Col>
                    <Popconfirm
                        title={t("确认加入吗？")}
                        onConfirm={() => {
                            join()
                        }}
                        okButtonProps={{ loading: joinLoading }}
                    >
                        <Button
                            loading={joinLoading}
                            disabled={islandInfo?.in}
                            type="primary"
                        >{islandInfo?.in ? t("您已加入该岛屿") : t("确认加入")}</Button>
                    </Popconfirm>

                </Col>
            </Row>}
        </div>

    )
}
