import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'sonner';
import { useAppStore } from './store';

export default function App() {
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      await initializeAuth();
      setIsCheckingSession(false);
    };

    loadSession();
  }, [initializeAuth]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#E6C2F3] border-t-[#C161E4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#623B6B] font-medium">
            Cargando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </CartProvider>
  );
}