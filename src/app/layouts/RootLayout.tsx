import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { ShoppingCart, User, LogOut, UserCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

const LOGO_URL = 'https://file.garden/aJyh9202yxmfpWlA/dLCHEYMEL/logo.png';

const getFirstName = (name?: string) => {
  if (!name) return '';
  return name.trim().split(' ')[0];
};

export function RootLayout() {
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const [avatarUrl, setAvatarUrl] = useState('');

  const cartItemsCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  const navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/productos', label: 'Productos' },
  ];

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) {
        setAvatarUrl('');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        setAvatarUrl('');
        return;
      }

      setAvatarUrl(data?.avatar_url || '');
    };

    void loadAvatar();
  }, [user?.id, location.pathname]);

  const handleLogout = async () => {
    await logout();
    setAvatarUrl('');
    navigate('/');
  };

  const UserAvatar = ({ size = 'small' }: { size?: 'small' | 'large' }) => {
    const sizeClass = size === 'large' ? 'h-9 w-9' : 'h-6 w-6';

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={user?.name || 'Usuario'}
          className={`${sizeClass} rounded-full object-cover border-2 border-[#E6C2F3] shadow-sm`}
        />
      );
    }

    return <UserCircle className={`${sizeClass} text-[#623B6B]`} />;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#6D524A]/10 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <img
                  src={LOGO_URL}
                  alt="Leche y Miel"
                  className="h-14 w-auto object-contain"
                />
              </motion.div>
            </Link>

            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative transition-colors ${
                    location.pathname === link.path
                      ? 'text-[#C161E4]'
                      : 'text-[#6D524A] hover:text-[#C161E4]'
                  }`}
                >
                  {link.label}

                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#C161E4]"
                    />
                  )}
                </Link>
              ))}

              <div className="w-px h-6 bg-[#6D524A]/20 mx-2" />

              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="text-sm font-medium text-[#623B6B] hover:text-[#C161E4] flex items-center gap-2"
                    >
                      <UserAvatar />
                      <span>Admin</span>
                    </Link>
                  ) : (
                    <Link
                      to="/perfil"
                      className="text-sm font-medium text-[#623B6B] hover:text-[#C161E4] flex items-center gap-2 cursor-pointer"
                    >
                      <UserAvatar />
                      <span className="max-w-[140px] truncate">
                        {getFirstName(user.name) || getFirstName(user.email)}
                      </span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-[#623B6B] hover:text-[#C161E4]"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-[#623B6B] hover:text-[#C161E4]"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Ingresar</span>
                </Link>
              )}

              <Link to="/carrito" className="relative ml-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <ShoppingCart className="h-6 w-6 text-[#6D524A] hover:text-[#C161E4] transition-colors" />

                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-[#C161E4] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <Outlet />

      <footer className="bg-[#301438] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={LOGO_URL}
                  alt="Leche y Miel"
                  className="h-16 w-auto object-contain"
                />
              </div>

              <p className="text-sm opacity-90">
                Endulzamos con amor, innovando con tradición
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <p className="text-sm opacity-90">Teléfono: +51 999 999 999</p>
              <p className="text-sm opacity-90">Email: info@lecheymiel.com</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Enlaces</h4>
              <div className="flex flex-col gap-2">
                <Link
                  to="/"
                  className="text-sm opacity-90 hover:text-[#E4835D] transition-colors"
                >
                  Inicio
                </Link>

                <Link
                  to="/productos"
                  className="text-sm opacity-90 hover:text-[#E4835D] transition-colors"
                >
                  Productos
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm opacity-75">
            © 2026 Leche y Miel. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}