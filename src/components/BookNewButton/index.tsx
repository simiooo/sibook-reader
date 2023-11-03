import { Upload } from 'antd'
import { Button } from 'antd'
import { Modal, ModalProps } from 'antd'
import React, { useEffect, useState } from 'react'
import { sha256 } from 'hash.js'
import { useBookState } from '../../store'
import { useUpload } from '../../utils/useUpload'



interface IndexProp {
    onChange?: () => void
}

export default function index(p: IndexProp) {
    const db_instance = useBookState((state) => state.db_instance)
    const {upload, loading} = useUpload()
    return (
        <Upload
            onChange={p.onChange}
            capture={true}
            showUploadList={false}
            customRequest={upload}
        >
            <Button
            type={'primary'}
            loading={loading}
            size='large'
            >上传</Button>
        </Upload>
    )
}
