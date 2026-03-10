
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const Root = () => {
  return <App />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
