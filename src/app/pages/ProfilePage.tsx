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
  Package,
  CalendarDays,
  MapPin,
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const MAX_IMAGE_SIZE_MB = 5;

type OrderStatus = 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';

type OrderItem = {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type CustomerOrder = {
  id: string;
  reservation_number: string;
  organization: string;
  full_name: string;
  phone: string;
  address: string;
  reference: string | null;
  delivery_date: string;
  total: number;
  status: OrderStatus;
  created_at?: string;
  items: OrderItem[];
};

type OrdersTab = 'all' | 'toDeliver' | 'delivered' | 'cancelled';

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date || '-';
  }

  return parsedDate.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (value: number) => {
  return `S/. ${Number(value || 0).toFixed(2)}`;
};

const getStatusLabel = (status: OrderStatus) => {
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'confirmado') return 'Por entregar';
  if (status === 'entregado') return 'Entregado';
  if (status === 'cancelado') return 'Cancelado';
  return status;
};

const getStatusIcon = (status: OrderStatus) => {
  if (status === 'pendiente') return Clock;
  if (status === 'confirmado') return Truck;
  if (status === 'entregado') return CheckCircle;
  return Ban;
};

const getStatusClasses = (status: OrderStatus) => {
  if (status === 'pendiente') {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  }

  if (status === 'confirmado') {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }

  if (status === 'entregado') {
    return 'bg-green-100 text-green-700 border-green-200';
  }

  return 'bg-red-100 text-red-700 border-red-200';
};

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

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [activeOrdersTab, setActiveOrdersTab] = useState<OrdersTab>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  const loadOrders = async () => {
    if (!user) {
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(
        'id, reservation_number, organization, full_name, phone, address, reference, delivery_date, total, status, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error cargando pedidos:', ordersError.message);
      toast.error('No se pudieron cargar tus pedidos');
      setIsLoadingOrders(false);
      return;
    }

    const orderIds = (ordersData || []).map((order) => order.id);

    if (orderIds.length === 0) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name, quantity, price, subtotal')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error cargando productos del pedido:', itemsError.message);
      toast.error('No se pudieron cargar los productos de tus pedidos');
      setIsLoadingOrders(false);
      return;
    }

    const ordersWithItems = (ordersData || []).map((order) => ({
      ...order,
      status: order.status as OrderStatus,
      items: (itemsData || []).filter((item) => item.order_id === order.id),
    }));

    setOrders(ordersWithItems as CustomerOrder[]);
    setIsLoadingOrders(false);
  };

  useEffect(() => {
    if (user) {
      void loadOrders();
    }
  }, [user?.id]);

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

  const pendingOrdersCount = orders.filter(
    (order) => order.status === 'pendiente'
  ).length;

  const toDeliverOrdersCount = orders.filter(
    (order) => order.status === 'confirmado'
  ).length;

  const deliveredOrdersCount = orders.filter(
    (order) => order.status === 'entregado'
  ).length;

  const cancelledOrdersCount = orders.filter(
    (order) => order.status === 'cancelado'
  ).length;

  const filteredOrders = orders.filter((order) => {
    if (activeOrdersTab === 'all') return true;
    if (activeOrdersTab === 'toDeliver') {
      return order.status === 'pendiente' || order.status === 'confirmado';
    }
    if (activeOrdersTab === 'delivered') return order.status === 'entregado';
    if (activeOrdersTab === 'cancelled') return order.status === 'cancelado';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-[#E6C2F3]/20"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-[#E6C2F3]/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#301438] flex items-center gap-3">
                <Package className="h-8 w-8 text-[#C161E4]" />
                Mis pedidos
              </h2>

              <p className="text-[#623B6B] mt-2">
                Aquí puedes ver el estado de tus pedidos registrados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="inline-flex items-center justify-center gap-2 bg-[#E6C2F3] text-[#301438] px-5 py-3 rounded-xl font-bold hover:bg-[#C161E4] hover:text-white transition-all"
            >
              <RefreshCw className="h-5 w-5" />
              Actualizar
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-yellow-700">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-700">
                {pendingOrdersCount}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-purple-700">Por entregar</p>
              <p className="text-2xl font-bold text-purple-700">
                {toDeliverOrdersCount}
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-700">Entregados</p>
              <p className="text-2xl font-bold text-green-700">
                {deliveredOrdersCount}
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-700">Cancelados</p>
              <p className="text-2xl font-bold text-red-700">
                {cancelledOrdersCount}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveOrdersTab('all')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeOrdersTab === 'all'
                  ? 'bg-[#C161E4] text-white'
                  : 'bg-[#FDF7FF] text-[#623B6B] hover:bg-[#E6C2F3]/40'
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setActiveOrdersTab('toDeliver')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeOrdersTab === 'toDeliver'
                  ? 'bg-[#C161E4] text-white'
                  : 'bg-[#FDF7FF] text-[#623B6B] hover:bg-[#E6C2F3]/40'
              }`}
            >
              Por ser entregados
            </button>

            <button
              type="button"
              onClick={() => setActiveOrdersTab('delivered')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeOrdersTab === 'delivered'
                  ? 'bg-[#C161E4] text-white'
                  : 'bg-[#FDF7FF] text-[#623B6B] hover:bg-[#E6C2F3]/40'
              }`}
            >
              Entregados
            </button>

            <button
              type="button"
              onClick={() => setActiveOrdersTab('cancelled')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                activeOrdersTab === 'cancelled'
                  ? 'bg-[#C161E4] text-white'
                  : 'bg-[#FDF7FF] text-[#623B6B] hover:bg-[#E6C2F3]/40'
              }`}
            >
              Cancelados
            </button>
          </div>

          {isLoadingOrders ? (
            <div className="text-center py-12 text-[#623B6B]">
              Cargando tus pedidos...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#E6C2F3]/40 rounded-2xl">
              <Receipt className="h-12 w-12 text-[#C161E4] mx-auto mb-4" />
              <p className="text-[#623B6B]">
                Todavía no tienes pedidos en esta sección.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="border-2 border-[#E6C2F3]/20 rounded-2xl overflow-hidden bg-white hover:border-[#E6C2F3]/60 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      className="w-full p-5 text-left"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="bg-[#FDF7FF] text-[#301438] font-bold px-3 py-1 rounded-full text-sm">
                              {order.reservation_number}
                            </span>

                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${getStatusClasses(
                                order.status
                              )}`}
                            >
                              <StatusIcon className="h-4 w-4" />
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-[#623B6B]">
                            <p className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-[#C161E4]" />
                              Entrega: {formatDate(order.delivery_date)}
                            </p>

                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#C161E4]" />
                              {order.address}
                            </p>
                          </div>
                        </div>

                        <div className="lg:text-right">
                          <p className="text-sm text-[#623B6B]">Total</p>
                          <p className="text-2xl font-bold text-[#C161E4]">
                            {formatMoney(order.total)}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#E6C2F3]/20 bg-[#FDFBF7] p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                          <div className="bg-white rounded-2xl p-4 border border-gray-100">
                            <h4 className="font-bold text-[#301438] mb-3">
                              Datos de entrega
                            </h4>

                            <div className="space-y-2 text-sm text-[#623B6B]">
                              <p>
                                <strong>Nombre:</strong> {order.full_name}
                              </p>
                              <p>
                                <strong>Teléfono:</strong> {order.phone}
                              </p>
                              <p>
                                <strong>Organización:</strong>{' '}
                                {order.organization}
                              </p>
                              <p>
                                <strong>Referencia:</strong>{' '}
                                {order.reference || '-'}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-4 border border-gray-100">
                            <h4 className="font-bold text-[#301438] mb-3">
                              Productos
                            </h4>

                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div
                                  key={`${order.id}-${item.product_id}`}
                                  className="flex items-start justify-between gap-3 text-sm"
                                >
                                  <div>
                                    <p className="font-semibold text-[#301438]">
                                      {item.product_name}
                                    </p>
                                    <p className="text-[#623B6B]">
                                      Cantidad: {item.quantity} x{' '}
                                      {formatMoney(item.price)}
                                    </p>
                                  </div>

                                  <p className="font-bold text-[#C161E4] shrink-0">
                                    {formatMoney(item.subtotal)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                          <span className="font-bold text-[#301438]">
                            Total del pedido
                          </span>

                          <span className="text-2xl font-bold text-[#C161E4]">
                            {formatMoney(order.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}