import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { Navigate } from 'react-router';
import {
  UserCircle,
  Save,
  Phone,
  Type,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const MAX_IMAGE_SIZE_MB = 5;

export function ProfilePage() {
  const { user, updateProfile } = useAppStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

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
        setPreviewUrl(data.avatar_url);
      }

      setIsLoadingAvatar(false);
    };

    void loadProfilePhoto();
  }, [user]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const validateImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
      return false;
    }

    const fileSizeMb = file.size / 1024 / 1024;

    if (fileSizeMb > MAX_IMAGE_SIZE_MB) {
      toast.error(`La imagen no debe superar ${MAX_IMAGE_SIZE_MB} MB`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateImageFile(file)) {
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const uploadAvatarFile = async () => {
    if (!selectedFile) {
      return avatarUrl.trim() || null;
    }

    const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Por favor completa tu nombre y teléfono');
      return;
    }

    if (avatarMode === 'url' && avatarUrl.trim()) {
      try {
        new URL(avatarUrl.trim());
      } catch {
        toast.error('La URL de la foto no es válida');
        return;
      }
    }

    setIsSaving(true);

    try {
      const result = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });

      if (result && result.success === false) {
        setIsSaving(false);
        toast.error(result.error || 'No se pudo actualizar el perfil');
        return;
      }

      let finalAvatarUrl: string | null = avatarUrl.trim() || null;

      if (avatarMode === 'upload') {
        finalAvatarUrl = await uploadAvatarFile();
      }

      if (avatarMode === 'url') {
        finalAvatarUrl = avatarUrl.trim() || null;
      }

      const { error: avatarError } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatarUrl,
        })
        .eq('id', user.id);

      if (avatarError) {
        throw new Error(avatarError.message);
      }

      setAvatarUrl(finalAvatarUrl || '');
      setPreviewUrl(finalAvatarUrl || '');
      setSelectedFile(null);

      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la foto de perfil'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const currentPreview = previewUrl || avatarUrl;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-[#E6C2F3]/20"
      >
        <div className="text-center mb-10">
          <div className="relative bg-[#E6C2F3]/10 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-[#E6C2F3]/30">
            {currentPreview && !isLoadingAvatar ? (
              <img
                src={currentPreview}
                alt={name || user.email}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="h-16 w-16 text-[#C161E4]" />
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

          <div className="bg-[#FDF7FF] border border-[#E6C2F3]/40 rounded-2xl p-5">
            <label className="block text-sm font-bold text-[#301438] mb-4">
              Foto de Perfil
            </label>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setAvatarMode('upload')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                  avatarMode === 'upload'
                    ? 'bg-[#C161E4] text-white border-[#C161E4]'
                    : 'bg-white text-[#623B6B] border-gray-200 hover:border-[#E6C2F3]'
                }`}
              >
                <Upload className="h-5 w-5" />
                Subir foto
              </button>

              <button
                type="button"
                onClick={() => setAvatarMode('url')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                  avatarMode === 'url'
                    ? 'bg-[#C161E4] text-white border-[#C161E4]'
                    : 'bg-white text-[#623B6B] border-gray-200 hover:border-[#E6C2F3]'
                }`}
              >
                <LinkIcon className="h-5 w-5" />
                Usar URL
              </button>
            </div>

            {avatarMode === 'upload' ? (
              <div>
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-[#E6C2F3] rounded-2xl p-6 text-center bg-white hover:bg-[#FDF7FF] transition-all">
                    <Upload className="h-10 w-10 text-[#C161E4] mx-auto mb-3" />

                    <p className="font-bold text-[#301438]">
                      Selecciona una imagen
                    </p>

                    <p className="text-sm text-[#623B6B] mt-1">
                      PNG, JPG o WEBP. Máximo {MAX_IMAGE_SIZE_MB} MB.
                    </p>

                    {selectedFile && (
                      <p className="text-sm text-[#C161E4] font-bold mt-3">
                        {selectedFile.name}
                      </p>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#623B6B] mb-2">
                  URL de imagen
                </label>

                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#623B6B]/50" />

                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                      setSelectedFile(null);
                    }}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E6C2F3] focus:ring-2 focus:ring-[#E6C2F3]/20 outline-none transition-all bg-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {(avatarUrl || previewUrl || selectedFile) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-4 flex items-center justify-center gap-2 w-full border-2 border-red-100 text-red-600 bg-red-50 py-3 rounded-xl font-bold hover:bg-red-100 transition-all"
              >
                <X className="h-5 w-5" />
                Quitar foto
              </button>
            )}

            <p className="text-xs text-[#623B6B]/70 mt-4">
              Esta foto se usará automáticamente cuando dejes un comentario.
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