import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ReadingPage } from './pages/ReadingPage.tsx'
import { HistoryPage } from './pages/HistoryPage.tsx'
import { AuthPage } from './pages/AuthPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="s/:id" element={<ReadingPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
