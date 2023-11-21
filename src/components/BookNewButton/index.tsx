import { ButtonProps, Upload } from 'antd'
import { Button } from 'antd'
import { useMemo } from 'react'
import { useUpload } from '../../utils/useUpload'



interface IndexProp  extends ButtonProps{
    onChange?: () => void
}

export default function index(p: IndexProp) {
    // const db_instance = useBookState((state) => state.db_instance)
    const {upload, loading} = useUpload()
    const renderType = useMemo(() => {
        return p.type ?? 'primary'
    }, [p.type])
    return (
        <Upload
            onChange={p.onChange}
            capture={true}
            showUploadList={false}
            customRequest={upload as any}
            multiple={true}
        >
            <Button
            type={renderType}
            loading={loading}
            size='large'
            >上传</Button>
        </Upload>
    )
}
