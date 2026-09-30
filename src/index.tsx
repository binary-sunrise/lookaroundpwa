import React from 'react';
import ReactDOM from 'react-dom/client';
import type { BeforeInstallPromptEvent } from './globals';

import Main from './main';
import { setupMockBackend } from './mocks';

// Initialize mock backend layer in dev or standalone mock mode
if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_BACKEND !== 'false') {
  setupMockBackend();
}

const strictMode = true;
console.log(`App Mode: ${import.meta.env.MODE}`);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.beforeInstallPromptEvent = event as unknown as BeforeInstallPromptEvent;
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  strictMode ? (
    <React.StrictMode>
      <Main />
    </React.StrictMode>
  ) : (
    <Main />
  ),
);
