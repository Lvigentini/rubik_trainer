import './theme';
import '@fontsource-variable/outfit';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/learn.css';
import './styles/play.css';
import './styles/home.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './progress/ProgressContext';
import { createProgressStore } from './progress/localStorageStore';

// Phase B: learning progress persists in localStorage (falls back to
// in-memory when storage is unavailable). Created once, outside React.
const progressStore = createProgressStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider store={progressStore}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProgressProvider>
  </StrictMode>,
);
