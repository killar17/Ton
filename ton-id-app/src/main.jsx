import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl = 'https://fa61b8b1-b8df-472b-b08a-7aeb1a55d28e-00-3fpbwga9nn959.pike.replit.dev/tonconnect-manifest.json';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
