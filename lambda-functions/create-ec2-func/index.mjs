//ref - https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/ec2/actions/run-instances.js
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import fs from 'fs';

const runEC2Instance = async (file_id) => {
    const userDataScript = fs.readFileSync('vm-script.sh', 'utf8').replace('$ID_FROM_LAMBDA', file_id).replace('$DYNAMODB_TABLE', process.env.FILE_TABLE);

    const REGION = process.env.REGION;
    const client = new EC2Client({ region: REGION });

    const command = new RunInstancesCommand({
        "MaxCount": 1,
        "MinCount": 1,
        "ImageId": "ami-0ddda618e961f2270",
        "InstanceType": "t2.micro",
        "EbsOptimized": false,
        "NetworkInterfaces": [
          {
            "AssociatePublicIpAddress": true,
            "DeviceIndex": 0,
          }
        ],
        "MetadataOptions": {
          "HttpEndpoint": "enabled",
          "HttpPutResponseHopLimit": 2,
          "HttpTokens": "optional"
        },
        "IamInstanceProfile": {
            "Arn": process.env.ROLE_ARN
        },
        "PrivateDnsNameOptions": {
          "HostnameType": "ip-name",
          "EnableResourceNameDnsARecord": true,
          "EnableResourceNameDnsAAAARecord": false
        },
        "UserData": Buffer.from(userDataScript).toString('base64')
      });
    
    return await client.send(command);
};

// Main Lambda entry point
export const handler = async (event) => {
  return await runEC2Instance(event.Records[0].dynamodb.Keys.id.S);
}
