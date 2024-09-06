import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { fromHttp, fromTemporaryCredentials } from "@aws-sdk/credential-providers"; 
export const backblazeIns = new S3Client({
    region: 'us-west-004',
    endpoint: "s3.us-west-004.backblazeb2.com",
    credentials: fromHttp({
        credentialsFullUri: new URL('/backblaze/authorization', location.origin).toString(),
    })
})

type HttpProviderResponse = {
    AccessKeyId: string;
    SecretAccessKey: string;
    Token: string;
    AccountId?: string;
    Expiration: string; // rfc3339
  };