import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("TITAN_OS: Entry point reached.");

const rootElement = document.getElementById('root');
if (rootElement) {
  // Clear the static loader and mount React
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("TITAN_OS: Root element not found.");
}