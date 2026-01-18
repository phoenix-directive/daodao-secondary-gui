import { Layout } from '@/components/layout/_layout';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { ShuttleProvider } from '@/delphi-labs/shuttle-react';
import { triggerReload } from '@/hooks/useReload';
import { ModalServiceProvider } from '@/lib/modal-service-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import { useTheme } from '@/lib/useTheme';
import { extensionProviders, mobileProviders } from '@/wallet/shuttle';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DaoPage } from './pages/dao/DaoPage';
import { ProposalCreatePage } from './pages/dao/ProposalCreatePage';
import { ProposalDetailPage } from './pages/dao/ProposalDetailPage';
import { LandingPage } from './pages/LandingPage';

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', (payload: any) => {
    const touched = payload?.updates?.some((u: any) => u.type === 'js-update');

    if (touched) triggerReload(50);
  });
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <>
      <ShuttleProvider
        extensionProviders={extensionProviders}
        mobileProviders={mobileProviders}
        persistent
        withLogging
      >
        <ModalServiceProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dao/:address/proposals/create" element={<ProposalCreatePage />} />
                <Route
                  path="/dao/:address/proposals/:proposalId"
                  element={<ProposalDetailPage />}
                />
                <Route path="/dao/:address/:tab?" element={<DaoPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ModalServiceProvider>
      </ShuttleProvider>
      <Toaster 
        position="top-right" 
        theme={theme === 'system' ? 'system' : theme}
        richColors 
        closeButton 
        expand 
        visibleToasts={5} 
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="daodao-ui-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
