import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PreparationPage } from './pages/Preparation';
import { AnalysisReportingPage } from './pages/AnalysisReporting';
import { KnowledgePage } from './pages/Knowledge';
import SystemManagerPage from './pages/SystemManager';
import RequireActiveSystem from './components/RequireActiveSystem';
import RequireSystem from './components/RequireSystem';
import { HelpCenterPage } from './pages/HelpCenter';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { NotFoundPage } from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { WelcomePage } from './pages/Welcome';
import { UploadPage } from './pages/Upload';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/systems" element={<SystemManagerPage />} />

          <Route path=":systemId" element={<RequireSystem />}>
            <Route element={<RequireActiveSystem />}>
              <Route element={<AppLayout />}>
                <Route path="preparation" element={<PreparationPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="analysis" element={<AnalysisReportingPage />} />
                <Route path="knowledge" element={<KnowledgePage />} />
                <Route path="help" element={<HelpCenterPage />} />
              </Route>
            </Route>
          </Route>


          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
