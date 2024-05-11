#!/bin/bash
# Execute DynamoDB query to get the item
id=$ID_FROM_LAMBDA
dbTable=$DYNAMODB_TABLE

item=$(aws dynamodb get-item --table-name $dbTable --key '{"id": {"S": "'$id'"}}' --query 'Item')
echo $item


input_file_path=$(echo $item | jq -r '.input_file_path.S')
echo $input_file_path

bucket_name=$(echo $input_file_path | cut -d'/' -f1)
echo $bucket_name

path_without_bucket=${input_file_path#"$bucket_name/"}
folder_structure=$(dirname "$path_without_bucket")

input_text=$(echo $item | jq -r '.input_text.S')

output_file=$id"-output.txt"

aws s3 cp s3://$input_file_path ./$output_file
echo "File downloaded"

echo ":"$input_text >> ./$output_file

aws s3 cp "./"$output_file "s3://"$bucket_name"/"$folder_structure"/"$output_file
echo "File processed successfully"

# Update DynamoDB record to add output_file_path
output_file_path="$bucket_name/$folder_structure/$output_file"
aws dynamodb update-item \
    --table-name $dbTable \
    --key '{"id": {"S": "'$id'"}}' \
    --update-expression "SET output_file_path = :val" \
    --expression-attribute-values '{":val": {"S": "'$output_file_path'"}}'
echo "DynamoDB record updated with output_file_path"

aws ec2 terminate-instances --instance-ids $(curl -s http://169.254.169.254/latest/meta-data/instance-id)
