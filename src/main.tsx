import ReactDOM from 'react-dom/client';
import './index.css';
import { initEditor } from './hooks/useEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom'; // <--- 1. TAMBAHKAN IMPORT INI
import App from './App';

const queryClient = new QueryClient();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initEditor());
} else {
    initEditor();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        {/* 2. BUNGKUS APP DENGAN BROWSER ROUTER */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </QueryClientProvider>
);