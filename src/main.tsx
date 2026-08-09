import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { initSentry } from './lib/sentry';
import { initDatadog } from './lib/datadog';

// Initialize Sentry & Datadog monitoring
initSentry();
initDatadog();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
