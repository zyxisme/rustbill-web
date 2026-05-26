// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { i18nReady } from './i18n';
import './index.css';
import App from './App';

// Wait for the detected locale bundle to load before first render
await i18nReady;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Load font CSS asynchronously — non-render-blocking.
// font-display:swap ensures text is visible with fallback fonts until these load.
import('harmonyos-sans-webfont-splitted');
