import axios from "axios";
import { config } from '../config';

export const postUserInput = async (id: string, userInput: string, s3FilePath: string) =>{
    try{
      const resourceUri = config.apiHost + config.dyanamodbResource.userinputPath
      const requestBody = {
        id: {S: id},
        input_text: {S: userInput},
        input_file_path: {S: s3FilePath}
      };
  
      const response  = await axios.post(resourceUri, requestBody, {
        headers: {
            'Content-Type': 'application/json'
        }
      });

      if(response.status !== 200) throw new Error('Invalid status code while storing user input.');

      console.debug("User input stored successfully.");
      return response;

    } catch(error){
      console.error('Error while processing user input: ', error);
      throw error;
    }
  }