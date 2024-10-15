import { Avatar, Col, Descriptions, Row } from 'antd'
import React from 'react'
import { useBookState } from '../../store'

export function Component() {

  const profile = useBookState(state => state.profile)

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
                ></Avatar>,
                span: 1,
                
              },
              {
                label: '昵称',
                children: <span>{profile?.nickname}</span>,
                span: 1,
              },
              {
                label: '邮箱',
                children: <span>{profile?.email}</span>,
                span: 1,
              },
              {
                label: '电话',
                children: <span>{profile?.phone}</span>,
                span: 1,
              },
              {
                label: '简介',
                children: <span>{profile?.des}</span>,
                span: 3,
              },
              {
                label: '会员等级',
                children: <div></div>,
                span: 3,
              },
              {
                label: '使用情况',
                children: <span></span>,
                span: 3,
              },
            ]}
          >

          </Descriptions>
        </Col>
      </Row>

    </div>
  )
}
