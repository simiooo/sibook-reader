import { useRequest } from "ahooks";
import { requestor } from "../requestor";
import { Button, Col, Descriptions, Divider, Modal, QRCode, Row } from "antd";
import { useTranslation } from "react-i18next";
import { useBookState } from "../../store";
import { DependencyList } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function useCreateShareCode() {
    const [shareModal, shareModalHolder] = Modal.useModal()
    const { t } = useTranslation()
    const { currentIsland, currentIsland_update } = useBookState(state => ({ currentIsland_update: state.currentIsland_update, currentIsland: state.currentIsland }))


    const { runAsync, loading } = useRequest(async (params: { islandId?: number }) => {
        try {
            const res = await requestor({
                url: '/island/createShareCode',
                data: {
                    islandId: params?.islandId,
                }
            })
            return res?.data?.data
        } catch (error) {
            return error
        }

    }, {
        manual: true,
        onSuccess(code) {
            const shareUrl = new URL(`/islandJoin?islandId=${currentIsland}&code=${code}`, window.location.origin)
            shareModal.success({
                width: '700px',
                title: t("分享链接"),
                content: <Row
                    gutter={[24, 24]}
                >
                    <Divider></Divider>
                    <Col span={24} >
                        <Descriptions
                            layout={'vertical'}
                            items={
                                [
                                    {

                                        label: t('链接'),
                                        children: <Button
                                            style={{
                                                whiteSpace: 'break-spaces'
                                            }}
                                            type="link"
                                            href={shareUrl.toString()}
                                            target="_blank"
                                        >{shareUrl.toString()}</Button>,
                                        span: 3,
                                    },
                                    {
                                        label: t('分享二维码'),
                                        children: <QRCode value={shareUrl.toString()} />,
                                        span: 3,

                                    },
                                ]
                            }
                        > </Descriptions>
                    </Col>
                    < Col span={24} >

                    </Col>
                </Row>
            })
        }
    })
    return {
        runAsync,
        loading,
        modal: {
            modal: shareModal,
            modalHolder: shareModalHolder,
        }
    }
}

export function useUserInvitedToIsland() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams();
    const { runAsync: getIslandInfo, data: island, loading } = useRequest(async () => {

        try {
            const payload = Object.fromEntries([...searchParams.entries()])
            if (!payload?.islandId) {
                return
            }
            const res = await requestor({
                url: '/island/getIslandInfo',
                data: {
                    islandId: Number(payload.islandId)
                }
            })
            return res?.data?.data
        } catch (error) {
            console.error(error)
        }

    }, {
        // manual: true
        refreshDeps: [searchParams]
    })
    const { runAsync: join, loading: joinLoading } = useRequest(async () => {

        try {
            const payload = Object.fromEntries([...searchParams.entries()])
            if (!payload?.islandId) {
                throw Error('获取岛屿失败')
            }
            if (!payload?.code) {
                throw Error('获取邀请码失败')
            }
            const res = await requestor({
                url: '/island/userInvitedToIsland',
                data: {
                    islandId: Number(payload?.islandId),
                    code: payload?.code
                }
            })
            navigate('/island')
            return res
        } catch (error) {
            return error
        }

    }, {
        manual: true
    })
    return {
        join,
        loading: loading,
        islandInfo: island,
        joinLoading,
        getIslandInfo: getIslandInfo
    }
}