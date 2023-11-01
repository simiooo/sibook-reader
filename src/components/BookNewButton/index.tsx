import { Upload } from 'antd'
import { Button } from 'antd'
import { Modal, ModalProps } from 'antd'
import React, { useEffect, useState } from 'react'
import { sha256 } from 'hash.js'
import { useBookState } from '../../store'

async function readFileAsBase64(file: File): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const base64String = (reader?.result as string)?.split?.(',')[1];
            resolve(base64String);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsDataURL(file);
    });
}

interface IndexProp {
    onChange?: () => void
}

export default function index(p: IndexProp) {
    const db_instance = useBookState((state) => state.db_instance)
    const [loading, setLoading] = useState<boolean>(false)

    return (
        <Upload
            onChange={p.onChange}
            capture={true}
            showUploadList={false}
            customRequest={async (info) => {
                setLoading(true)
                try {
                    const file = await readFileAsBase64(info.file)
                    const hash = sha256().update(file).digest('hex')
                    const hasSame = await db_instance?.select({
                        from: 'BookItems',
                        where: {
                            hash
                        }
                    })
                    if ((hasSame ?? [])?.length > 0) {
                        throw(Error('请勿重复上传文件'))
                    }
                    const res = await db_instance?.insert({
                        into: "BookItems",
                        upsert: true,
                        values: [{
                            name: info.file.name,
                            des: info.file.name,
                            hash
                        }],
                    })
                    const res_blob = await db_instance?.insert({
                        into: "BookBlob",
                        upsert: true,
                        values: [{
                            id: hash,
                            blob: file,
                        }],
                    })
                    if (res && res_blob) {
                        info.onSuccess(res)
                    } else {
                        throw(Error('上传失败'))
                    } 
                } catch (error) {
                    info.onError(error)
                } finally{
                    setLoading(false)
                }
                
            }}
        >
            <Button
            type={'primary'}
            loading={loading}
            >上传</Button>
        </Upload>
    )
}
