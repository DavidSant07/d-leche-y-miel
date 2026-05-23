import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  CheckCircle,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  User,
  Building,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';

type ReceiptCartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  cartQuantity: number;
};

type ConfirmationState = {
  reservationNumber: string;
  organization: string;
  date: string;
  fullName: string;
  phone: string;
  address: string;
  reference: string;
  cart: ReceiptCartItem[];
  total: number;
};

const LOGO_URL =
  'https://file.garden/aJyh9202yxmfpWlA/dLCHEYMEL/logoredondo';
  
export function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const state = location.state as ConfirmationState | null;
  const confettiShownRef = useRef(false);

  useEffect(() => {
    if (!state) {
      navigate('/productos');
      return;
    }

    if (confettiShownRef.current) {
      return;
    }

    confettiShownRef.current = true;

    clearCart();
    confetti.reset();

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.35 },
      colors: ['#C161E4', '#E3B7F3', '#FFFFFF'],
      scalar: 0.8,
      ticks: 160,
    });
  }, [state, navigate, clearCart]);

  if (!state) {
    return null;
  }

  const {
    reservationNumber,
    organization,
    date,
    fullName,
    phone,
    address,
    reference,
    cart,
    total,
  } = state;

  const handleCall = () => {
    window.location.href = 'tel:+51999999999';
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Tengo una reserva con el número ${reservationNumber}. Me gustaría confirmar mi pedido.`
    );
    window.open(`https://wa.me/51999999999?text=${message}`, '_blank');
  };

  const getImageDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      return await new Promise((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          resolve(typeof reader.result === 'string' ? reader.result : null);
        };

        reader.onerror = () => {
          resolve(null);
        };

        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colors = {
      purple: [198, 154, 215] as const,
      purpleDark: [86, 58, 96] as const,
      orange: [228, 131, 93] as const,
      brown: [62, 39, 35] as const,
      text: [80, 66, 61] as const,
      muted: [125, 110, 104] as const,
      softBg: [253, 251, 247] as const,
      line: [232, 218, 210] as const,
      white: [255, 255, 255] as const,
    };

    const margin = 18;
    let y = 18;

    const currentDate = new Date();

    const formattedDate = currentDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = currentDate.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const deliveryDate = new Date(date).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const money = (value: number) => `S/. ${value.toFixed(2)}`;

    const writeText = (
      text: string,
      x: number,
      textY: number,
      options?: {
        size?: number;
        color?: readonly [number, number, number];
        font?: 'normal' | 'bold' | 'italic';
        align?: 'left' | 'center' | 'right';
      }
    ) => {
      doc.setFont('helvetica', options?.font || 'normal');
      doc.setFontSize(options?.size || 10);
      doc.setTextColor(...(options?.color || colors.text));
      doc.text(String(text || '-'), x, textY, {
        align: options?.align || 'left',
      });
    };

    const writeWrappedText = (
      text: string,
      x: number,
      textY: number,
      maxWidth: number,
      lineHeight = 5,
      options?: {
        size?: number;
        color?: readonly [number, number, number];
        font?: 'normal' | 'bold' | 'italic';
      }
    ) => {
      doc.setFont('helvetica', options?.font || 'normal');
      doc.setFontSize(options?.size || 10);
      doc.setTextColor(...(options?.color || colors.text));

      const lines = doc.splitTextToSize(String(text || '-'), maxWidth) as string[];
      doc.text(lines, x, textY);

      return lines.length * lineHeight;
    };

    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);

        doc.setDrawColor(...colors.line);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        writeText('Leche y Miel', margin, pageHeight - 10, {
          size: 9,
          color: colors.muted,
          font: 'bold',
        });

        writeText(
          'Postres artesanales hechos con amor',
          pageWidth / 2,
          pageHeight - 10,
          {
            size: 9,
            color: colors.muted,
            align: 'center',
          }
        );

        writeText(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 10, {
          size: 9,
          color: colors.muted,
          align: 'right',
        });
      }
    };

    const addNewPageIfNeeded = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 28) {
        doc.addPage();
        y = 22;
      }
    };

    const drawSectionTitle = (title: string) => {
      addNewPageIfNeeded(14);

      doc.setFillColor(...colors.purple);
      doc.roundedRect(margin, y, 4, 8, 2, 2, 'F');

      writeText(title, margin + 8, y + 6, {
        size: 13,
        color: colors.brown,
        font: 'bold',
      });

      y += 14;
    };

    const drawInfoBox = (
      x: number,
      boxY: number,
      width: number,
      height: number,
      title: string,
      lines: string[]
    ) => {
      doc.setFillColor(...colors.softBg);
      doc.setDrawColor(...colors.line);
      doc.roundedRect(x, boxY, width, height, 4, 4, 'FD');

      writeText(title, x + 5, boxY + 8, {
        size: 10,
        color: colors.purpleDark,
        font: 'bold',
      });

      let lineY = boxY + 16;

      lines.forEach((line) => {
        const used = writeWrappedText(line, x + 5, lineY, width - 10, 4.5, {
          size: 9,
          color: colors.text,
        });

        lineY += Math.max(used, 4.5);
      });
    };

    const drawTableHeader = () => {
      doc.setFillColor(...colors.purple);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 3, 3, 'F');

      writeText('Producto', margin + 5, y + 7, {
        size: 9,
        color: colors.white,
        font: 'bold',
      });

      writeText('Cant.', 122, y + 7, {
        size: 9,
        color: colors.white,
        font: 'bold',
        align: 'center',
      });

      writeText('Precio', 152, y + 7, {
        size: 9,
        color: colors.white,
        font: 'bold',
        align: 'right',
      });

      writeText('Subtotal', pageWidth - margin - 5, y + 7, {
        size: 9,
        color: colors.white,
        font: 'bold',
        align: 'right',
      });

      y += 13;
    };

    const addNewPageForTableIfNeeded = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 34) {
        doc.addPage();
        y = 22;
        drawTableHeader();
      }
    };

    const logoDataUrl = await getImageDataUrl(LOGO_URL);

    doc.setFillColor(...colors.purple);
    doc.rect(0, 0, pageWidth, 48, 'F');

    if (logoDataUrl) {
      const imageType = logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoDataUrl, imageType, 17, 12, 26, 26);
    } else {
      doc.setFillColor(...colors.white);
      doc.circle(30, 24, 12, 'F');

      writeText('LM', 30, 28, {
        size: 12,
        color: colors.purple,
        font: 'bold',
        align: 'center',
      });
    }

    writeText('LECHE Y MIEL', 48, 22, {
      size: 20,
      color: colors.white,
      font: 'bold',
    });

    writeText('Recibo de reserva', 48, 31, {
      size: 10,
      color: colors.white,
    });

    writeText(`Recibo No. ${reservationNumber}`, pageWidth - margin, 21, {
      size: 10,
      color: colors.white,
      font: 'bold',
      align: 'right',
    });

    writeText(`${formattedDate} - ${formattedTime}`, pageWidth - margin, 30, {
      size: 9,
      color: colors.white,
      align: 'right',
    });

    y = 62;

    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 5, 5, 'FD');

    writeText('Número de reserva', margin + 8, y + 9, {
      size: 9,
      color: colors.muted,
      font: 'bold',
    });

    writeText(String(reservationNumber), margin + 8, y + 19, {
      size: 18,
      color: colors.orange,
      font: 'bold',
    });

    writeText(
      'Guarda este recibo para cualquier consulta sobre tu pedido.',
      pageWidth - margin - 8,
      y + 16,
      {
        size: 9,
        color: colors.muted,
        align: 'right',
      }
    );

    y += 36;

    drawSectionTitle('Datos del cliente');

    const boxGap = 8;
    const boxWidth = (pageWidth - margin * 2 - boxGap) / 2;

    drawInfoBox(margin, y, boxWidth, 42, 'Cliente', [
      `Nombre: ${fullName}`,
      `Teléfono: ${phone}`,
      `Organización: ${organization || '-'}`,
    ]);

    drawInfoBox(margin + boxWidth + boxGap, y, boxWidth, 42, 'Entrega', [
      `Fecha: ${deliveryDate}`,
      'Horario: 12:00 PM - 6:00 PM',
      `Referencia: ${reference || '-'}`,
    ]);

    y += 52;

    drawSectionTitle('Dirección de entrega');

    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 4, 4, 'FD');

    writeWrappedText(address || '-', margin + 6, y + 9, pageWidth - margin * 2 - 12, 5, {
      size: 10,
      color: colors.text,
    });

    y += 36;

    drawSectionTitle('Resumen del pedido');

    drawTableHeader();

    cart.forEach((item) => {
      const subtotal = item.price * item.cartQuantity;
      const nameLines = doc.splitTextToSize(item.name, 82) as string[];
      const rowHeight = Math.max(13, nameLines.length * 5 + 6);

      addNewPageForTableIfNeeded(rowHeight);

      doc.setDrawColor(...colors.line);
      doc.line(margin, y + rowHeight - 2, pageWidth - margin, y + rowHeight - 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(nameLines, margin + 5, y + 5);

      writeText(String(item.cartQuantity), 122, y + 6, {
        size: 10,
        color: colors.text,
        align: 'center',
      });

      writeText(money(item.price), 152, y + 6, {
        size: 10,
        color: colors.text,
        align: 'right',
      });

      writeText(money(subtotal), pageWidth - margin - 5, y + 6, {
        size: 10,
        color: colors.brown,
        font: 'bold',
        align: 'right',
      });

      y += rowHeight;
    });

    addNewPageIfNeeded(38);

    y += 8;

    doc.setFillColor(255, 246, 239);
    doc.setDrawColor(...colors.orange);
    doc.roundedRect(112, y, pageWidth - margin - 112, 24, 5, 5, 'FD');

    writeText('TOTAL', 120, y + 10, {
      size: 11,
      color: colors.brown,
      font: 'bold',
    });

    writeText(money(total), pageWidth - margin - 8, y + 17, {
      size: 18,
      color: colors.orange,
      font: 'bold',
      align: 'right',
    });

    y += 42;

    addNewPageIfNeeded(28);

    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 5, 5, 'FD');

    writeText('¡Muchas gracias por tu reserva!', pageWidth / 2, y + 11, {
      size: 14,
      color: colors.purpleDark,
      font: 'bold',
      align: 'center',
    });

    writeText(
      'Nos comunicaremos contigo para confirmar los detalles de tu pedido.',
      pageWidth / 2,
      y + 20,
      {
        size: 10,
        color: colors.muted,
        align: 'center',
      }
    );

    addFooter();

    doc.save(`recibo-${reservationNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#FFF5EE] to-[#FFE4D6] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
          >
            <CheckCircle className="h-16 w-16 text-green-600" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-4">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-xl text-[#6D524A] max-w-2xl mx-auto">
            Tu pedido ha sido registrado exitosamente. Nos pondremos en contacto contigo pronto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8"
        >
          <div className="text-center mb-8">
            <div className="inline-block bg-[#E4835D]/10 px-6 py-3 rounded-full mb-4">
              <span className="text-sm text-[#6D524A]">Número de Reserva</span>
            </div>
            <div className="text-4xl font-bold text-[#E4835D] mb-2">
              {reservationNumber}
            </div>
            <p className="text-sm text-[#6D524A]">
              Guarda este número para futuras consultas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#FDFBF7] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-6 w-6 text-[#E4835D]" />
                <h3 className="font-semibold text-[#3E2723]">Organización</h3>
              </div>
              <p className="text-lg text-[#6D524A]">{organization}</p>
            </div>

            <div className="bg-[#FDFBF7] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6 text-[#E4835D]" />
                <h3 className="font-semibold text-[#3E2723]">Fecha de Entrega</h3>
              </div>
              <p className="text-lg text-[#6D524A]">
                {new Date(date).toLocaleDateString('es-PE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-[#6D524A] mt-1">12:00 PM - 6:00 PM</p>
            </div>

            <div className="bg-[#FDFBF7] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-[#E4835D]" />
                <h3 className="font-semibold text-[#3E2723]">Nombre</h3>
              </div>
              <p className="text-lg text-[#6D524A]">{fullName}</p>
            </div>

            <div className="bg-[#FDFBF7] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-6 w-6 text-[#E4835D]" />
                <h3 className="font-semibold text-[#3E2723]">Teléfono</h3>
              </div>
              <p className="text-lg text-[#6D524A]">{phone}</p>
            </div>

            <div className="bg-[#FDFBF7] rounded-2xl p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-[#E4835D]" />
                <h3 className="font-semibold text-[#3E2723]">Dirección de Entrega</h3>
              </div>
              <p className="text-lg text-[#6D524A] mb-2">{address}</p>
              <p className="text-sm text-[#6D524A]">Referencia: {reference}</p>
            </div>
          </div>

          <div className="border-t border-[#E4835D]/20 pt-6">
            <h3 className="font-semibold text-[#3E2723] mb-4">Resumen del Pedido</h3>

            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-[#3E2723]">{item.name}</p>
                      <p className="text-sm text-[#6D524A]">
                        Cantidad: {item.cartQuantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-[#3E2723]">
                    S/. {(item.price * item.cartQuantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#E4835D]/10 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[#3E2723]">Total:</span>
                <span className="text-3xl font-bold text-[#E4835D]">
                  S/. {total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E4835D]/20">
              <button
                onClick={handleDownloadReceipt}
                className="w-full bg-white text-[#E4835D] py-4 rounded-xl flex items-center justify-center gap-2 border-2 border-[#E4835D] hover:bg-[#E4835D] hover:text-white transition-colors font-semibold shadow-sm"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar Recibo PDF
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-[#3E2723] text-center mb-6">
            ¿Necesitas ayuda con tu pedido?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCall}
              className="bg-[#E4835D] text-white p-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#6D524A] transition-colors shadow-lg"
            >
              <Phone className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold text-lg">¡Llámanos!</div>
                <div className="text-sm opacity-90">+51 999 999 999</div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="bg-green-500 text-white p-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-600 transition-colors shadow-lg"
            >
              <MessageCircle className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold text-lg">
                  ¡Comunícate con nosotros!
                </div>
                <div className="text-sm opacity-90">WhatsApp</div>
              </div>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="text-[#E4835D] hover:text-[#6D524A] font-semibold transition-colors"
          >
            Volver al Inicio
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}