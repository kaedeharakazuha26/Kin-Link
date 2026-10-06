import React from 'react'

const Loading = ({ height = '100vh' }) => {
  return (
    <div role="status" aria-label="Loading" style={{ height }} className="flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );
};
export default Loading;
