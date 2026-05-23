import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Navigate } from 'react-router';
import { UserCircle, Save, Phone, Type, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, updateProfile, authLoading } = useAppStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const result = await updateProfile({
      name: cleanName,
      phone: cleanPhone,
    });

    if (!result.success) {
      toast.error(result.error || 'No se pudo actualizar el perfil');
      return;
    }

    toast.success('Perfil actualizado correctamente');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-[#E6C2F3]/20"
      >
        <div className="text-center mb-10">
          <div className="bg-[#E6C2F3]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="h-12 w-12 text-[#C161E4]" />
          </div>

          <h1 className="text-3xl font-bold text-[#301438]">Mi Perfil</h1>

          <p className="text-[#623B6B] mt-2">
            Actualiza tus datos personales aquí
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all disabled:opacity-60"
                required
                disabled={authLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Correo Electrónico
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#623B6B]/50" />
              </div>

              <div className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-500 cursor-not-allowed">
                {user.email}
              </div>
            </div>

            <p className="text-xs text-[#623B6B]/70 mt-2">
              El correo se administra desde tu cuenta de acceso.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Número Telefónico
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-[#623B6B]/50" />
              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all disabled:opacity-60"
                required
                disabled={authLoading}
              />
            </div>
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: authLoading ? 1 : 1.02 }}
              whileTap={{ scale: authLoading ? 1 : 0.98 }}
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#E6C2F3] text-[#301438] py-4 rounded-xl font-bold text-lg hover:bg-[#C161E4] hover:text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {authLoading ? 'Guardando...' : 'Guardar Cambios'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}