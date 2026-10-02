import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { MomentumProvider } from './context/MomentumContext.jsx';
import { purgeLegacyClientStorage } from './services/storagePurge.js';
import './index.css';

// HARD SECURITY RULE: Immediately clean any leftover legacy browser storage on boot
purgeLegacyClientStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <MomentumProvider>
        <App />
      </MomentumProvider>
    </AuthProvider>
  </React.StrictMode>
);
