import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SocketProvider } from './context/SocketContext'; // Import the provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* The App component itself doesn't need the provider, but its children do.
        We can wrap it here, but it's better to do it inside App.js to give it the token.
        Let's adjust the plan and wrap inside App.js.
     */}
    <App />
  </React.StrictMode>
);
