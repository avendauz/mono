import React from 'react';
import {App} from './App';
import {createRoot} from "react-dom/client";

createRoot(
    document.getElementById('root') || document.body
).render(
    <React.StrictMode>
    <App />
    </React.StrictMode>

)

