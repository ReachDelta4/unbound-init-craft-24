import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #4299e1',
      borderRadius: '5px',
      backgroundColor: '#ebf8ff',
      color: '#2b6cb0'
    }}>
      <h2>Test Component</h2>
      <p>If you can see this, the app is working correctly!</p>
    </div>
  );
};

export default TestComponent; 