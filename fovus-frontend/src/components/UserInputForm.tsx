import React, { useState } from 'react';
import { FileInput, Label, TextInput, Button } from 'flowbite-react';
import { nanoid } from 'nanoid';
import { getPresignedUrl, uploadFileToS3 } from '../services/S3ApiService';
import { postUserInput } from '../services/DynamodbApiService';


const UserInputForm: React.FC = () => {
  const [textInput, setTextInput] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(event.target.value);
  };

  const validateFileType = (file : File) => {
    const allowedExtensions = ["txt"];
    const fileNameParts = file.name.split(".");
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();

    return allowedExtensions.includes(fileExtension);
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
  
    if (selectedFile) {
      if (validateFileType(selectedFile)){
        setFile(selectedFile);
      }else{
        setFile(null);
        event.target.value = '';
        alert("Only text file(.txt) is allowed.");
      }      
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) =>{
    event.preventDefault();
    setIsProcessing(true);
    console.log('Text Input:', textInput);

    if (file) {
      const id = nanoid(10);
      try{
        const presignedUrlResponse = await getPresignedUrl('user-' + id +'/'+ file.name);
        const uploadUrl = presignedUrlResponse.uploadURL;
        const bucketFilePath = presignedUrlResponse.filePath;

        const uploadResult = await uploadFileToS3(file, uploadUrl);
        const dbStoreResult = await postUserInput(id, textInput, bucketFilePath);
      }catch(error){
        console.error("Error while processing your output: ",error);
      }
      setTextInput('');
      setIsProcessing(false);
    }else{
      alert("Select a valid text file (.txt).")
      setIsProcessing(false);
    }
  }

  return (
    <form className="flex max-w-md flex-col gap-4" 
          onSubmit={handleSubmit}
    >
      <div>
        <div className="mb-2 block">
          <Label htmlFor="text-input" value="Text input" />
        </div>
        <TextInput  id="text-input" 
                    type="text" 
                    value={textInput}
                    onChange={handleTextInputChange}
                    required 
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="file-upload" value="File input" />
        </div>
        <FileInput  id="file-upload" 
                    helperText="Only .txt file is allowed."
                    onChange={handleFileInputChange}
                    required
        />
      </div>
      <Button type="submit"
              disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Submit'}
      </Button>
    </form>
  );
};

export default UserInputForm;