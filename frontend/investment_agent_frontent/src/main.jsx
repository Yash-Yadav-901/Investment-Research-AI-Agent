import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/react'
import { Provider } from 'react-redux'
import { store, persistor } from './store/store.js'
import { PersistGate } from 'redux-persist/integration/react'

import {createBrowserRouter, RouterProvider,  createRoutesFromElements, Route} from "react-router-dom";
import CombineTools from './components/toolsAndOptions/CombineTools.jsx'
import MainWorkspace from './components/workspace/MainWorkspace.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route >
    <Route path="/home" element={<CombineTools/>} />
    <Route path="/workspace/:workspaceId" element={<MainWorkspace/>} />
    <Route path="*" element={<div>404 Not Found</div>} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
