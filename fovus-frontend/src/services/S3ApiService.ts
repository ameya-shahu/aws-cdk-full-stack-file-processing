import axios from 'axios';
import { config } from '../config';

export const getPresignedUrl = async (filename: string) =>{
    try{
      const resourceUri = config.apiHost + config.s3Resource.preSignedPath
      const response  = await axios.post(resourceUri, { filename });

      if(response.status !== 200) throw new Error('Invalid status code while fetching pre-signed URL.');

      console.debug("PresignedURL fetched successfully.");
      return response.data;

    } catch(error){
      console.error('Error while fetching pre-signed URL: ', error);
      throw error;
    }
  }

export const uploadFileToS3 = async (file: File,presignedUrl: string) => {
    try{
      const response = await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': 'text/plain'
        },
      });

      if(response.status !== 200) throw new Error('Invalid status code while uploading file to S3.');

      console.debug('File uploaded to S3 successfully.');
      return true;

    } catch(error){
        console.error('Error uploading file to S3: ', error);
        throw error;
    }
  }