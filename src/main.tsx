import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'harmonyos-sans-webfont-splitted';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './i18n';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
