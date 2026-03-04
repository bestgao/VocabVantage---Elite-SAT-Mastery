
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { hydrateVault } from './persistence';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// PRE-MOUNT HYDRATION GATE
const bootData = hydrateVault();

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App bootData={bootData} />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Fatal Render Error:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Application Crash</h1>
      <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      <button onclick="localStorage.clear(); location.reload();">Clear Data & Reset</button>
    </div>
  `;
}
