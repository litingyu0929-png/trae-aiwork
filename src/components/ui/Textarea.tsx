import React from 'react';

export const Textarea = ({ className = '', ...props }: any) => {
  return (
    <textarea 
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow ${className}`} 
      {...props} 
    />
  );
};
