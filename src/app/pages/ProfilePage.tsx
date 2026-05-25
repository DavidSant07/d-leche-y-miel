import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Navigate } from 'react-router';
import { UserCircle, Save, Phone, Type, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
  const { user, updateProfile } = useAppStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!user) {
        setIsLoadingAvatar(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }

      setIsLoadingAvatar(false);
    };

    void loadProfilePhoto();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Por favor completa tu nombre y teléfono');
      return;
    }

    setIsSaving(true);

    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
    });

    if (result && result.success === false) {
      setIsSaving(false);
      toast.error(result.error || 'No se pudo actualizar el perfil');
      return;
    }

    const { error: avatarError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (avatarError) {
      toast.error(avatarError.message || 'No se pudo guardar la foto de perfil');
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
          <div className="bg-[#E6C2F3]/10 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-[#E6C2F3]/30">
            {avatarUrl && !isLoadingAvatar ? (
              <img
                src={avatarUrl}
                alt={name || user.email}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="h-14 w-14 text-[#C161E4]" />
            )}
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Correo Electrónico
            </label>

            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-500 cursor-not-allowed">
              {user.email}
            </div>
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#301438] mb-2">
              Foto de Perfil URL
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-[#623B6B]/50" />
              </div>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all"
                placeholder="https://..."
              />
            </div>

            <p className="text-xs text-[#623B6B]/70 mt-2">
              Pega aquí el enlace de tu imagen. Esta foto se usará
              automáticamente en tus comentarios.
            </p>
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: isSaving ? 1 : 1.02 }}
              whileTap={{ scale: isSaving ? 1 : 0.98 }}
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#E6C2F3] text-[#301438] py-4 rounded-xl font-bold text-lg hover:bg-[#C161E4] hover:text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}