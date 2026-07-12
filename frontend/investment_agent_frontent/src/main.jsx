import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClerkProvider, useAuth } from '@clerk/react'
import { Provider } from 'react-redux'
import { store, persistor } from './store/store.js'
import { PersistGate } from 'redux-persist/integration/react'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import axiosInstance from './utils/axiosConfig';

import AppLayout from './components/toolsAndOptions/AppLayout.jsx'
import WorkspaceLayout from './components/workspace/WorkspaceLayout.jsx'
import MainWorkspace from './components/workspace/MainWorkspace.jsx'
import SignInPage from './components/singinAndSignUp/SignIn.jsx'
import SignUpPage from './components/singinAndSignUp/SignUp.jsx'
import ContentList from './components/toolsAndOptions/ContentLits.jsx'
import PageNotFound from './components/WrongPages/PageNotFound.jsx'
import Home from './components/toolsAndOptions/Home.jsx'

const FullPageLoader = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFBEB] text-slate-950 font-sans p-6">
      <div className="relative w-20 h-16 animate-bounce mb-6">
        <div className="relative w-16 h-14 bg-[#FBBF24] border-4 border-[#0F172A] rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] flex items-center justify-center overflow-visible">
          <div className="absolute -top-[7px] left-1.5 w-6 h-2 bg-[#D97706] border-b-4 border-[#0F172A] rounded-t-sm"></div>
          <svg className="w-5 h-5 stroke-[3] text-[#0F172A] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-[#0F172A] animate-pulse">
        {message}
      </p>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const syncUser = async () => {
        try {
          await axiosInstance.post('/api/v1/user/signup');
          setIsSynced(true);
        } catch (error) {
          console.error("Failed to sync user with database:", error);
          
          setIsSynced(true);
        }
      };
      syncUser();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <FullPageLoader message="Loading security..." />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (!isSynced) return <FullPageLoader message="Initializing account..." />;
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />} />
        <Route path="/workspaces" element={<ContentList />} />
      </Route>

      <Route element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
        <Route path="/workspace/:workspaceId" element={<MainWorkspace />} />
      </Route>

      <Route path="/" element={<Navigate to="/sign-in" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Provider store={store}>
        <PersistGate loading={<FullPageLoader message="Syncing local storage..." />} persistor={persistor}>
          <RouterProvider router={router} />
        </PersistGate>
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)
