// ref - https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/s3/scenarios/presigned-url-upload.js
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const createPresignedUrlWithClient = async ({ region, bucket, key }) => {
    const client = new S3Client({ region });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
};
// Main Lambda entry point
export const handler = async (event) => {
  return await getUploadURL(event)
}

const getUploadURL = async function(event) {
    const requestBody = JSON.parse(event.body);

    const REGION = process.env.REGION;
    const BUCKET = process.env.BUCKET_NAME;
    
    const KEY = requestBody.filename;
    let uploadURL = await createPresignedUrlWithClient({
        region: REGION,
        bucket: BUCKET,
        key: KEY,
    });

  return new Promise((resolve, reject) => {
    //console.log("Here - ", uploadURL);
    resolve({
      "statusCode": 200,
      "isBase64Encoded": false,
      headers: {
        "Access-Control-Allow-Headers" : "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
    },
      "body": JSON.stringify({
          "uploadURL": uploadURL,
          "filePath": BUCKET + '/' + KEY
      })
    })
  })
}