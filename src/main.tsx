import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import { AuthProvider } from '@/context/AuthContext.tsx'
import { ProductStoreProvider } from '@/context/ProductStoreContext.tsx'
import { OrderProvider } from '@/context/OrderContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OrderProvider>
        <ProductStoreProvider>
          <App />
        </ProductStoreProvider>
      </OrderProvider>
    </AuthProvider>
  </StrictMode>,
)
