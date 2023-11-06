import { ButtonProps, Upload } from 'antd'
import { Button } from 'antd'
import { Modal, ModalProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { sha256 } from 'hash.js'
import { useBookState } from '../../store'
import { useUpload } from '../../utils/useUpload'



interface IndexProp  extends ButtonProps{
    onChange?: () => void
}

export default function index(p: IndexProp) {
    const db_instance = useBookState((state) => state.db_instance)
    const {upload, loading} = useUpload()
    const renderType = useMemo(() => {
        return p.type ?? 'primary'
    }, [p.type])
    return (
        <Upload
            onChange={p.onChange}
            capture={true}
            showUploadList={false}
            customRequest={upload}
        >
            <Button
            type={renderType}
            loading={loading}
            size='large'
            >上传</Button>
        </Upload>
    )
}
