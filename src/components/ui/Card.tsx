import React from 'react';

export const Card = ({ children, className = '', ...props }: any) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};
