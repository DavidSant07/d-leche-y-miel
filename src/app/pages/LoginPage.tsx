import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../store';
import { User, Lock, Mail, Phone, Type } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, authLoading } = useAppStore();

  const [isRegistering, setIsRegistering] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !password) {
      toast.error('Ingresa tu correo y contraseña');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    if (isRegistering) {
      if (!cleanName || !cleanPhone) {
        toast.error('Por favor completa todos los campos');
        return;
      }

      const result = await register({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      if (!result.success) {
        toast.error(result.error || 'No se pudo crear la cuenta');
        return;
      }

      toast.success('Cuenta creada exitosamente');
      resetForm();
      navigate('/productos');
      return;
    }

    const result = await login(cleanEmail, password);

    if (!result.success) {
      toast.error(result.error || 'Correo o contraseña incorrectos');
      return;
    }

    const currentUser = useAppStore.getState().user;

    toast.success(
      currentUser?.name
        ? `Bienvenido ${currentUser.name}`
        : 'Bienvenido'
    );

    if (currentUser?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/productos');
    }
  };

  const toggleMode = () => {
    setIsRegistering((current) => !current);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-[#E6C2F3]/20"
      >
        <div className="text-center mb-8">
          <div className="bg-[#E6C2F3]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-[#C161E4]" />
          </div>

          <h2 className="text-3xl font-bold text-[#301438]">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          <p className="text-[#623B6B] mt-2">
            {isRegistering
              ? 'Ingresa tus datos para registrarte'
              : 'Ingresa a tu cuenta para continuar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[#301438] mb-2">
                    Nombre Completo
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Type className="h-5 w-5 text-[#623B6B]/50" />
                    </div>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                      placeholder="Juan Pérez"
                      required={isRegistering}
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#301438] mb-2">
                    Teléfono
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-[#623B6B]/50" />
                    </div>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                      placeholder="+51 999 999 999"
                      required={isRegistering}
                      disabled={authLoading}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Correo Electrónico
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#623B6B]/50" />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                placeholder="tu@correo.com"
                required
                disabled={authLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Contraseña
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#623B6B]/50" />
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                disabled={authLoading}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: authLoading ? 1 : 1.02 }}
            whileTap={{ scale: authLoading ? 1 : 0.98 }}
            type="submit"
            disabled={authLoading}
            className="w-full bg-[#E6C2F3] text-[#301438] py-4 rounded-xl font-bold text-lg hover:bg-[#C161E4] hover:text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {authLoading
              ? 'Procesando...'
              : isRegistering
                ? 'Crear Cuenta'
                : 'Entrar'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            disabled={authLoading}
            className="text-[#C161E4] font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}