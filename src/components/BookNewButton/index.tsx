import { ButtonProps, Upload } from 'antd'
import { Button } from 'antd'
import { useMemo } from 'react'
import { useUpload } from '../../utils/useUpload'
import { useTranslation } from 'react-i18next'



interface IndexProp  extends ButtonProps{
    onChange?: () => void;
}

export default function index(p: IndexProp) {
    // const db_instance = useBookState((state) => state.db_instance)
    const {t} = useTranslation()
    const {upload, loading} = useUpload({onFinish: p?.onChange})
    const renderType = useMemo(() => {
        return p.type ?? 'primary'
    }, [p.type])
    return (
        <Upload
            onChange={p.onChange}
            showUploadList={false}
            customRequest={upload as any}
            multiple={true}
        >
            <Button
            type={renderType}
            loading={loading}
            size='large'
            >{t('加入书架')}</Button>
        </Upload>
    )
}
