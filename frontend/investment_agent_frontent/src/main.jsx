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

// Guard
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div className="text-white text-center mt-[20vh]">Loading...</div>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route path="/home" element={<ProtectedRoute><CombineTools /></ProtectedRoute>} />
      <Route path="/workspaces" element={<ProtectedRoute><ContentList /></ProtectedRoute>} />   
      <Route path="/workspace/:workspaceId" element={<ProtectedRoute><MainWorkspace /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/sign-in" replace />} />
      <Route path="*" element={<div className="text-white text-center mt-[20vh]">404 Not Found</div>} />
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
