@echo off
echo [INFO] Initializing Lambda functions....

cd ./lambda-functions/create-ec2-func && npm install && cd ../dynamodb-func && npm install && cd ../s3-presigned-url-func && npm install && echo [INFO] lambda functions intialized. && echo [INFO] creating aws stack. && cd ../../cdk-setup && npm install && cdk deploy --require-approval never && echo [INFO] AWS Stack deployment completed. && echo [INFO] Initializing frontend. && for /f "usebackq tokens=* delims=" %%a in (`aws cloudformation describe-stacks --stack-name fovusCdkStack --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text`) do (
    set VITE_API_ENDPOINT_URL=%%a
) && cd ../fovus-frontend && npm install && npm run dev