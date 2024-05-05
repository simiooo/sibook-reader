import COS from 'cos-js-sdk-v5'
import { requestor } from './requestor';
type COSCredential = Partial<{
    TmpSecretId: string,
    TmpSecretKey: string,
    Token: string,
}>
type COSAuthorization = Partial<{
    "ExpiredTime": number,
    "Expiration": string,
    "StartTime": number,
    "RequestId": string,
    Credentials: COSCredential
}>
export const cos = new COS({
    // getAuthorization 必选参数
    getAuthorization: async function (options, callback) {
        // 初始化时不会调用，只有调用 cos 方法（例如 cos.putObject）时才会进入
        // 异步获取临时密钥
        // 服务端 JS 和 PHP 例子：https://github.com/tencentyun/cos-js-sdk-v5/blob/master/server/
        // 服务端其他语言参考 COS STS SDK ：https://github.com/tencentyun/qcloud-cos-sts-sdk
        // STS 详细文档指引看：https://cloud.tencent.com/document/product/436/14048
        const res = await requestor<{ data: COSAuthorization }>({
            url: '/cos/authorization',
            data: {

            }
        })
        callback({
            TmpSecretId: res.data.data.Credentials.TmpSecretId,
            TmpSecretKey: res.data.data.Credentials.TmpSecretKey,
            SecurityToken: res.data.data.Credentials.Token,
            StartTime: res.data.data.StartTime, // 时间戳，单位秒，如：1580000000
            ExpiredTime: res.data.data.ExpiredTime, // 时间戳，单位秒，如：1580000000
        });
    }
});