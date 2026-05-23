import { motion } from 'motion/react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';

type FormData = {
  organization: string;
  date: string;
  time: string;
  fullName: string;
  phone: string;
  address: string;
  reference: string;
  email: string;
};

export function OrderFormPage() {
  const navigate = useNavigate();
  const { cart, getTotal } = useCart();
  const user = useAppStore((state) => state.user);
  const addReservation = useAppStore((state) => state.addReservation);

  const [step, setStep] = useState<'organization' | 'date' | 'details'>(
    'organization'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    organization: '',
    date: '',
    time: '',
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    reference: '',
    email: user?.email || '',
  });

  if (cart.length === 0) {
    return <Navigate to="/productos" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleOrganizationSelect = (organization: string) => {
    setFormData((current) => ({
      ...current,
      organization,
    }));

    setStep('date');
  };

  const handleDateSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      date: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    const reservationNumber = `LM-${Date.now().toString().slice(-8)}`;
    const total = getTotal();

    const cleanFullName = formData.fullName.trim();
    const cleanPhone = formData.phone.trim();
    const cleanAddress = formData.address.trim();
    const cleanReference = formData.reference.trim();

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        reservation_number: reservationNumber,
        organization: formData.organization,
        full_name: cleanFullName,
        phone: cleanPhone,
        address: cleanAddress,
        reference: cleanReference || null,
        delivery_date: formData.date,
        total,
        status: 'pendiente',
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      setIsSubmitting(false);
      toast.error(orderError?.message || 'No se pudo registrar el pedido');
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: orderData.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.cartQuantity,
      price: item.price,
      subtotal: item.price * item.cartQuantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      setIsSubmitting(false);
      toast.error(itemsError.message || 'No se pudieron registrar los productos');
      return;
    }

    addReservation({
      date: formData.date,
      time: formData.time,
      organization: formData.organization,
      address: cleanAddress,
      reference: cleanReference,
      status: 'pending',
      items: cart,
      total,
      userId: user.id,
      guestName: cleanFullName,
      guestPhone: cleanPhone,
    });

    toast.success('Pedido registrado correctamente');

    navigate('/confirmacion', {
      state: {
        reservationNumber,
        organization: formData.organization,
        date: formData.date,
        time: formData.time,
        fullName: cleanFullName,
        phone: cleanPhone,
        address: cleanAddress,
        reference: cleanReference,
        email: formData.email,
        cart,
        total,
      },
    });

    setIsSubmitting(false);
  };

  const isFormValid = () => {
    return Boolean(
      formData.organization &&
        formData.date &&
        formData.time &&
        formData.fullName.trim() &&
        formData.phone.trim() &&
        formData.address.trim() &&
        formData.reference.trim()
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#3E2723] mb-4">
            Completa tu Pedido
          </h1>

          <p className="text-[#6D524A]">
            Por favor, proporciona la información de entrega
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {['organization', 'date', 'details'].map((currentStep, index) => (
              <div key={currentStep} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === currentStep
                      ? 'bg-[#E4835D] text-white'
                      : index < ['organization', 'date', 'details'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>

                {index < 2 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index < ['organization', 'date', 'details'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 'organization' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-[#3E2723] mb-6">
              ¿De qué organización formas parte?
            </h2>

            <div className="space-y-4">
              {['XAM', 'Probannec'].map((organization) => (
                <motion.button
                  key={organization}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOrganizationSelect(organization)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                    formData.organization === organization
                      ? 'border-[#E4835D] bg-[#E4835D]/5'
                      : 'border-gray-200 hover:border-[#E4835D]/50'
                  }`}
                >
                  <div className="text-xl font-semibold text-[#3E2723]">
                    {organization}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'date' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-[#3E2723] mb-6">
              ¿Qué fecha deseas tu pedido?
            </h2>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#E4835D]" />

                <input
                  type="date"
                  value={formData.date}
                  onChange={handleDateSelect}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#E4835D] focus:outline-none transition-colors"
                />
              </div>

              <div className="relative flex-1">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#E4835D]" />

                <select
                  value={formData.time || ''}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      time: e.target.value,
                    }))
                  }
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#E4835D] focus:outline-none transition-colors appearance-none bg-white"
                >
                  <option value="" disabled>
                    Horario Preferido
                  </option>
                  <option value="12:00 PM - 2:00 PM">
                    12:00 PM - 2:00 PM
                  </option>
                  <option value="2:00 PM - 4:00 PM">
                    2:00 PM - 4:00 PM
                  </option>
                  <option value="4:00 PM - 6:00 PM">
                    4:00 PM - 6:00 PM
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#FDFBF7] rounded-xl p-4">
              <Clock className="h-5 w-5 text-[#E4835D]" />
              <span className="text-[#6D524A]">
                Horario de entrega: 12:00 PM - 6:00 PM
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                whileHover={{ scale: formData.date && formData.time ? 1.02 : 1 }}
                whileTap={{ scale: formData.date && formData.time ? 0.98 : 1 }}
                onClick={() => setStep('details')}
                disabled={!formData.date || !formData.time}
                className={`px-8 py-3 rounded-full font-semibold text-lg transition-all ${
                  formData.date && formData.time
                    ? 'bg-[#E4835D] text-white hover:bg-[#6D524A] shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-[#3E2723] mb-6">
              Datos de Entrega
            </h2>

            <div className="mb-6 flex items-start gap-3 bg-[#E4835D]/10 border border-[#E4835D]/20 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 text-[#E4835D] mt-0.5" />
              <p className="text-sm text-[#6D524A]">
                Tu pedido quedará registrado en nuestra base de datos y podrás
                recibir confirmación con tu número de reserva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-[#6D524A] mb-2">
                  <User className="h-5 w-5 text-[#E4835D]" />
                  Nombres Completos *
                </label>

                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      fullName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E4835D] focus:outline-none transition-colors"
                  placeholder="Ingresa tu nombre completo"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[#6D524A] mb-2">
                  <Phone className="h-5 w-5 text-[#E4835D]" />
                  Número Telefónico *
                </label>

                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E4835D] focus:outline-none transition-colors"
                  placeholder="+51 999 999 999"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[#6D524A] mb-2">
                  <MapPin className="h-5 w-5 text-[#E4835D]" />
                  Dirección *
                </label>

                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E4835D] focus:outline-none transition-colors"
                  placeholder="Calle, número, distrito"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[#6D524A] mb-2">
                  <MapPin className="h-5 w-5 text-[#E4835D]" />
                  Referencia *
                </label>

                <input
                  type="text"
                  required
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      reference: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E4835D] focus:outline-none transition-colors"
                  placeholder="Cerca de..., frente a..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[#6D524A] mb-2">
                  <Mail className="h-5 w-5 text-[#E4835D]" />
                  Correo Electrónico
                </label>

                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-500 cursor-not-allowed"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: isFormValid() && !isSubmitting ? 1.02 : 1 }}
                  whileTap={{ scale: isFormValid() && !isSubmitting ? 0.98 : 1 }}
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className={`w-full py-4 rounded-full font-semibold text-lg transition-all ${
                    isFormValid() && !isSubmitting
                      ? 'bg-[#E4835D] text-white hover:bg-[#6D524A] shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Registrando pedido...' : 'Poner Reserva'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-[#3E2723] mb-4">
            Resumen del Pedido
          </h3>

          <div className="space-y-2 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[#6D524A]">
                  {item.name} x{item.cartQuantity}
                </span>

                <span className="font-semibold text-[#3E2723]">
                  S/. {(item.price * item.cartQuantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <span className="text-xl font-bold text-[#3E2723]">Total:</span>

            <span className="text-2xl font-bold text-[#E4835D]">
              S/. {getTotal().toFixed(2)}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}