import React from 'react';

interface LoadingProps {
  height?: string;
}

const Loading: React.FC<LoadingProps> = ({ height = '100vh' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ height }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      <span className="text-xs font-medium text-gray-500 animate-pulse">Loading Kin-Link...</span>
    </div>
  );
};

export default Loading;
