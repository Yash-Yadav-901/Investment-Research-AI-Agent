import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ClerkProvider, useAuth } from '@clerk/react'
import { Provider } from 'react-redux'
import { store, persistor } from './store/store.js'
import { PersistGate } from 'redux-persist/integration/react'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from "react-router-dom";

import CombineTools from './components/toolsAndOptions/CombineTools.jsx'
import MainWorkspace from './components/workspace/MainWorkspace.jsx'
import SignInPage from './components/singinAndSignUp/SignIn.jsx'
import SignUpPage from './components/singinAndSignUp/SignUp.jsx'

// Guard: redirects unauthenticated users to /sign-in
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* Public auth routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* Protected routes */}
      <Route path="/home" element={<ProtectedRoute><CombineTools /></ProtectedRoute>} />
      <Route path="/workspace/:workspaceId" element={<ProtectedRoute><MainWorkspace /></ProtectedRoute>} />

      {/* Redirect root to sign-in */}
      <Route path="/" element={<Navigate to="/sign-in" replace />} />

      <Route path="*" element={<div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>404 Not Found</div>} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RouterProvider router={router} />
        </PersistGate>
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)
