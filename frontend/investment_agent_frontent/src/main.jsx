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

// Guard with DB sync
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
          // Set to true anyway so the user is not permanently blocked if signup fails
          setIsSynced(true);
        }
      };
      syncUser();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <div className="text-white text-center mt-[20vh]">Loading...</div>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (!isSynced) return <div className="text-white text-center mt-[20vh]">Initializing account...</div>;
  return children;
};


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

     
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<div className="p-6 text-white">Welcome Home!</div>} />
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
        <PersistGate loading={<div>Loading Redux...</div>} persistor={persistor}>
          <RouterProvider router={router} />
        </PersistGate>
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)
