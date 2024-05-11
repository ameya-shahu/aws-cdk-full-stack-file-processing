import React from 'react';
import {  } from 'flowbite-react';
import UserInputForm from '../components/UserInputForm';

const HomePage: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="container mx-auto border border-gray-300 pt-10 pb-10 ml-10 mr-10">
        <h1 className="text-3xl text-center font-bold mb-5">Process your text file</h1>
        <div className='flex justify-center items-center'>
            <UserInputForm />
        </div>
      </div>
    </div>
  );
};

export default HomePage;