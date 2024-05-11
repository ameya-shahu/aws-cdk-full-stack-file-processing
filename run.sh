#!/bin/bash

echo "[INFO] Initializing Lambda functions...."

cd ./lambda-functions/create-ec2-func
npm install
cd ../dynamodb-func
npm install
cd ../s3-presigned-url-func
npm install
echo "[INFO] Lambda functions initialized."

echo "[INFO] Creating AWS stack."
cd ../../cdk-setup
npm install
npx cdk deploy --require-approval never
echo "[INFO] AWS Stack deployment completed."

echo "[INFO] Initializing frontend."
export VITE_API_ENDPOINT_URL=$(aws cloudformation describe-stacks --stack-name fovusCdkStack --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
cd ../fovus-frontend
echo "VITE_API_ENDPOINT_URL=$VITE_API_ENDPOINT_URL" > .env
npm install
npm run dev
