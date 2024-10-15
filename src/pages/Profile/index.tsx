import { Avatar, Col, Descriptions, Progress, Row, Spin } from 'antd'
import React from 'react'
import { useBookState } from '../../store'
import { useRequest } from 'ahooks'
import { requestor } from '../../utils/requestor'
type FeatureUsage = Partial<{
  name: string;
  des: string;
  max_free_feature_usage: number;
  id: number;
  max_vip1_feature_usage: number;
  cloud_storage_capacity: number;
  price: number;
  create_at: string;
  update_at: string;
}>;
export function Component() {

  const profile = useBookState(state => state.profile)

  const { data: subscriptionStatus, loading } = useRequest(async () => {
    if (!profile) {
      return
    }
    try {
      const plan = await requestor<{ data: FeatureUsage[] }>({
        url: '/profile/v/userCurrentPlan',
        method: 'post'
      })
      const usage = await requestor<{ data: number }>({
        url: '/profile/v/userCurrentStorageUsage',
        method: 'post',
      })
      return {
        planData: plan?.data?.data?.[0] ?? { cloud_storage_capacity: 0 },
        usageData: usage?.data?.data ?? 1
      }
    } catch (error) {

    }

  }, {
    refreshDeps: [profile]
  })

  return (
    <div
      style={{
        paddingTop: '4rem'
      }}
    >
      <Row
        justify={'center'}
      >
        <Col
          span={20}
        >
          <Spin
            spinning={loading}
          >
            <Descriptions
              bordered
              items={[

                {
                  label: '用户名',
                  children: <span>{profile?.username}</span>,
                  span: 3,
                },
                {
                  label: '头像',
                  children: <Avatar
                  size={'large'}
                  >{profile?.nickname?.[0]}</Avatar>,
                  span: 1,

                },
                {
                  label: '昵称',
                  children: <span>{profile?.nickname ?? '-'}</span>,
                  span: 1,
                },
                {
                  label: '邮箱',
                  children: <span>{profile?.email ?? '-'}</span>,
                  span: 1,
                },
                {
                  label: '电话',
                  children: <span>{profile?.phone ?? '-'}</span>,
                  span: 1,
                },
                {
                  label: '简介',
                  children: <span>{profile?.des ?? '-'}</span>,
                  span: 3,
                },
                {
                  label: '会员等级',
                  children: <div>{subscriptionStatus?.planData?.name ?? '-'}</div>,
                  span: 3,
                },
                {
                  label: '使用情况',
                  children: <Progress
                    status={'exception'}
                    format={(percent) => `${Math.round(subscriptionStatus?.usageData / 1024 / 1024)} MB / ${subscriptionStatus?.planData?.cloud_storage_capacity} MB`}
                    percent={100 * subscriptionStatus?.usageData / 1024 / 1024 / subscriptionStatus?.planData?.cloud_storage_capacity}

                    size={[300, 40]}
                  />,
                  // <span>{`${(subscriptionStatus?.usageData / 1024 / 1024).toFixed(2)}/${subscriptionStatus?.planData?.cloud_storage_capacity}MB`}</span>,
                  span: 3,
                },
              ]}
            >

            </Descriptions>
          </Spin>

        </Col>
      </Row>

    </div>
  )
}
