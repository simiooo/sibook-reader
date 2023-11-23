import React, { useState } from 'react'
import ExplainModal from '../ExplainModal'
import TranslateModal from '../TranslateModal'
import { FloatButton } from 'antd'
import { BulbOutlined, MoreOutlined, TranslationOutlined } from '@ant-design/icons'

export interface FloatAiMenuProps{
    copiedText?: string;
    translator?: {value?: boolean, onCancel?: (value: boolean) => void};
    explainer?: {value?: boolean, onCancel?: (value: boolean) => void}
}

export default function FloatAiMenu(props: FloatAiMenuProps) {
    const [floatOpen, setFloatOpen] = useState<boolean>(true)

  return (
    <div>
        <ExplainModal
        open={props?.explainer?.value}
        onCancel={() => props?.explainer?.onCancel?.(false)}
        text={props?.copiedText}
      >

      </ExplainModal>
      <TranslateModal
        open={props?.translator?.value}
        onCancel={() => props?.translator?.onCancel?.(false)}
        text={props?.copiedText}
      ></TranslateModal>
      <FloatButton.Group
        open={floatOpen}
        shape="square" 
        trigger="click"
        icon={<MoreOutlined />}
        onOpenChange={setFloatOpen}
        type='primary'
        style={{ right: 24 , bottom: 24}}>
        <FloatButton
          onClick={() => props?.explainer?.onCancel?.(true)}
          icon={<BulbOutlined />} type="primary" />
        <FloatButton
          onClick={() => props?.translator?.onCancel?.(true)}
          icon={<TranslationOutlined />} type="primary" />
      </FloatButton.Group>
    </div>
  )
}
