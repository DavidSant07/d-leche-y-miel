import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  ShoppingCart,
  User,
  LogOut,
  UserCircle,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Music2,
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

const LOGO_URL = 'https://file.garden/aJyh9202yxmfpWlA/dLCHEYMEL/logo.png';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    url: 'https://instagram.com/',
    icon: Instagram,
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/',
    icon: Facebook,
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/',
    icon: Music2,
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/',
    icon: Youtube,
  },
  {
    name: 'WhatsApp',
    url: 'https://wa.me/51999999999',
    icon: MessageCircle,
  },
];

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

      <footer className="relative overflow-hidden bg-[#301438] text-white mt-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#C161E4] rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#E6C2F3] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-[#E4835D] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 mb-12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  ¿Tienes un evento especial?
                </h3>

                <p className="text-white/80 max-w-2xl">
                  Escríbenos por WhatsApp y te ayudamos a elegir el postre
                  perfecto para tu celebración.
                </p>
              </div>

              <a
                href="https://wa.me/51999999999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] text-white px-7 py-4 rounded-full font-bold hover:scale-105 hover:shadow-xl transition-all"
              >
                <MessageCircle className="h-5 w-5" />
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1">
              <Link to="/" className="inline-flex items-center mb-5">
                <img
                  src={LOGO_URL}
                  alt="Leche y Miel"
                  className="h-20 w-auto object-contain drop-shadow-lg"
                />
              </Link>

              <p className="text-white/80 leading-relaxed mb-6">
                Endulzamos tus momentos especiales con postres artesanales,
                preparados con amor, tradición y los mejores ingredientes.
              </p>

              <div className="flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.name}
                      className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-[#C161E4] hover:border-[#C161E4] hover:-translate-y-1 transition-all shadow-lg"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#E6C2F3] fill-[#E6C2F3]" />
                Navegación
              </h4>

              <div className="space-y-3">
                <Link
                  to="/"
                  className="group flex items-center gap-2 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Inicio
                </Link>

                <Link
                  to="/productos"
                  className="group flex items-center gap-2 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Productos
                </Link>

                <Link
                  to="/carrito"
                  className="group flex items-center gap-2 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Carrito
                </Link>

                <Link
                  to={user ? '/perfil' : '/login'}
                  className="group flex items-center gap-2 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  {user ? 'Mi perfil' : 'Ingresar'}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-5">Contacto</h4>

              <div className="space-y-4">
                <a
                  href="tel:+51999999999"
                  className="flex items-start gap-3 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <Phone className="h-5 w-5 mt-0.5 text-[#E6C2F3]" />
                  <span>+51 999 999 999</span>
                </a>

                <a
                  href="mailto:info@lecheymiel.com"
                  className="flex items-start gap-3 text-white/80 hover:text-[#E6C2F3] transition-colors"
                >
                  <Mail className="h-5 w-5 mt-0.5 text-[#E6C2F3]" />
                  <span>info@lecheymiel.com</span>
                </a>

                <div className="flex items-start gap-3 text-white/80">
                  <MapPin className="h-5 w-5 mt-0.5 text-[#E6C2F3]" />
                  <span>Lima, Perú</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-5">Horario de atención</h4>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-white/80">
                  <Clock className="h-5 w-5 mt-0.5 text-[#E6C2F3]" />
                  <div>
                    <p className="font-semibold text-white">Lunes a Sábado</p>
                    <p>9:00 a.m. - 8:00 p.m.</p>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm text-white/80">
                    También recibimos pedidos personalizados para cumpleaños,
                    aniversarios, reuniones y eventos especiales.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
            <p>© 2026 Leche y Miel. Todos los derechos reservados.</p>

            <p className="flex items-center gap-1">
              Hecho con
              <Heart className="h-4 w-4 text-[#E6C2F3] fill-[#E6C2F3]" />
              para endulzar tus momentos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}