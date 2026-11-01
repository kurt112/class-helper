import { createRoot } from 'react-dom/client';
import { StoreProvider } from './store';

// The print view loads without Ionic: Ionic's full-screen layout breaks multi-page printing.
const root = createRoot(document.getElementById('root')!);
const page = location.pathname.startsWith('/print') ? import('./pages/PrintPage') : import('./App');
page.then(({ default: Page }) =>
  root.render(
    <StoreProvider>
      <Page />
    </StoreProvider>,
  ),
);

// Offline: cache the app after the first visit. Production only, so dev reloads stay fresh.
if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');
