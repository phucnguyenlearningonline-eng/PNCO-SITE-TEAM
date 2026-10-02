import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Dọn dẹp hoàn toàn các khóa dữ liệu cũ trên trình duyệt vì toàn bộ dữ liệu lưu trữ tập trung trên Supabase Cloud
try {
  const legacyKeys = [
    'phuc_nguyen_me_materials_v1',
    'phuc_nguyen_me_expenses_v1',
    'phuc_nguyen_me_projects_v1',
    'phuc_nguyen_me_suppliers_v1',
    'phuc_nguyen_me_customers_v1',
    'phuc_nguyen_me_users_v1'
  ];
  legacyKeys.forEach((key) => localStorage.removeItem(key));
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
