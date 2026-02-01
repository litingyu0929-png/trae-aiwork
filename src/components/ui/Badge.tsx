import React from 'react';

export const Badge = ({ children, variant = 'gray', className = '' }: any) => {
  const colors: any = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
};
