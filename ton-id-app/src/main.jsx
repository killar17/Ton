import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl = 'https://tonbot-etpb8pt6i-killar17s-projects.vercel.app/tonconnect-manifest.json';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
