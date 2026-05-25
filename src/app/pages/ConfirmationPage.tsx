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
    window.location.href = 'tel:+51920206016';
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Tengo una reserva con el número ${reservationNumber}. Me gustaría confirmar mi pedido.`
    );

    window.open(`https://wa.me/51920206016?text=${message}`, '_blank');
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

  const formatDeliveryDate = (value: string) => {
    const parsedDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return value || '-';
    }

    return parsedDate.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colors = {
      primary: [168, 133, 185] as const,
      primaryDark: [86, 58, 96] as const,
      deepPurple: [48, 20, 56] as const,
      accent: [228, 131, 93] as const,
      text: [62, 39, 35] as const,
      muted: [120, 96, 105] as const,
      softBg: [253, 251, 247] as const,
      softPurple: [247, 238, 250] as const,
      line: [232, 218, 237] as const,
      white: [255, 255, 255] as const,
    };

    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const footerY = pageHeight - 14;
    const safeBottom = pageHeight - 26;

    let y = 14;

    const emittedAt = new Date();

    const formattedDate = emittedAt.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = emittedAt.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const deliveryDate = formatDeliveryDate(date);
    const deliveryTime = '12:00 PM - 6:00 PM';

    const calculatedTotal = cart.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.cartQuantity || 1);
    }, 0);

    const finalTotal = Number(total || calculatedTotal || 0);

    const money = (value: number) => `S/. ${Number(value || 0).toFixed(2)}`;

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
      lineHeight = 4.5,
      options?: {
        size?: number;
        color?: readonly [number, number, number];
        font?: 'normal' | 'bold' | 'italic';
      }
    ) => {
      doc.setFont('helvetica', options?.font || 'normal');
      doc.setFontSize(options?.size || 9);
      doc.setTextColor(...(options?.color || colors.text));

      const lines = doc.splitTextToSize(String(text || '-'), maxWidth) as string[];

      doc.text(lines, x, textY);

      return lines.length * lineHeight;
    };

    const drawMiniHeader = () => {
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 18, 'F');

      writeText('LECHE Y MIEL', margin, 11.5, {
        size: 10,
        color: colors.white,
        font: 'bold',
      });

      writeText('Recibo de reserva', pageWidth - margin, 11.5, {
        size: 9,
        color: colors.white,
        font: 'bold',
        align: 'right',
      });

      y = 28;
    };

    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);

        doc.setDrawColor(...colors.line);
        doc.setLineWidth(0.25);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        writeText('Leche y Miel', margin, footerY, {
          size: 8,
          color: colors.muted,
          font: 'bold',
        });

        writeText('Postres artesanales hechos con amor', pageWidth / 2, footerY, {
          size: 8,
          color: colors.muted,
          align: 'center',
        });

        writeText(`Página ${page} de ${pageCount}`, pageWidth - margin, footerY, {
          size: 8,
          color: colors.muted,
          align: 'right',
        });
      }
    };

    const ensureSpace = (neededSpace: number, repeatTableHeader = false) => {
      if (y + neededSpace > safeBottom) {
        doc.addPage();
        drawMiniHeader();

        if (repeatTableHeader) {
          drawTableHeader();
        }
      }
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(12);

      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, y - 1, 4, 8, 2, 2, 'F');

      writeText(title, margin + 8, y + 5, {
        size: 12,
        color: colors.deepPurple,
        font: 'bold',
      });

      y += 12;
    };

    const drawSmallCard = (
      x: number,
      cardY: number,
      width: number,
      height: number,
      title: string,
      lines: string[]
    ) => {
      doc.setFillColor(...colors.white);
      doc.setDrawColor(...colors.line);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, cardY, width, height, 4, 4, 'FD');

      writeText(title, x + 4, cardY + 7, {
        size: 9,
        color: colors.primaryDark,
        font: 'bold',
      });

      let lineY = cardY + 15;

      lines.forEach((line) => {
        const usedHeight = writeWrappedText(line, x + 4, lineY, width - 8, 4.2, {
          size: 8.3,
          color: colors.text,
        });

        lineY += Math.max(usedHeight, 4.2);
      });
    };

    const drawTableHeader = () => {
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, y, contentWidth, 9, 3, 3, 'F');

      writeText('Producto', margin + 5, y + 6.2, {
        size: 8.5,
        color: colors.white,
        font: 'bold',
      });

      writeText('Cant.', 122, y + 6.2, {
        size: 8.5,
        color: colors.white,
        font: 'bold',
        align: 'center',
      });

      writeText('Precio', 152, y + 6.2, {
        size: 8.5,
        color: colors.white,
        font: 'bold',
        align: 'right',
      });

      writeText('Subtotal', pageWidth - margin - 5, y + 6.2, {
        size: 8.5,
        color: colors.white,
        font: 'bold',
        align: 'right',
      });

      y += 11;
    };

    const logoDataUrl = await getImageDataUrl(LOGO_URL);

    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setFillColor(...colors.deepPurple);
    doc.circle(3, 42, 34, 'F');
    doc.circle(pageWidth - 18, 0, 40, 'F');

    if (logoDataUrl) {
      try {
        const imageType = logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logoDataUrl, imageType, margin, 8, 27, 27);
      } catch {
        doc.setFillColor(...colors.white);
        doc.circle(margin + 13.5, 21.5, 12, 'F');

        writeText('LM', margin + 13.5, 25, {
          size: 11,
          color: colors.primary,
          font: 'bold',
          align: 'center',
        });
      }
    } else {
      doc.setFillColor(...colors.white);
      doc.circle(margin + 13.5, 21.5, 12, 'F');

      writeText('LM', margin + 13.5, 25, {
        size: 11,
        color: colors.primary,
        font: 'bold',
        align: 'center',
      });
    }

    writeText('LECHE Y MIEL', 46, 19, {
      size: 18,
      color: colors.white,
      font: 'bold',
    });

    writeText('Recibo de reserva', 46, 28, {
      size: 9.5,
      color: colors.white,
    });

    y = 52;

    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(margin, y, contentWidth, 22, 5, 5, 'FD');

    writeText('NÚMERO DE RESERVA', margin + 6, y + 8, {
      size: 7.5,
      color: colors.muted,
      font: 'bold',
    });

    writeText(reservationNumber, margin + 6, y + 17, {
      size: 14,
      color: colors.accent,
      font: 'bold',
    });

    writeText('FECHA DE EMISIÓN', pageWidth / 2 - 10, y + 8, {
      size: 7.5,
      color: colors.muted,
      font: 'bold',
    });

    writeText(`${formattedDate} - ${formattedTime}`, pageWidth / 2 - 10, y + 17, {
      size: 8.8,
      color: colors.text,
    });

    writeText('TOTAL', pageWidth - margin - 6, y + 8, {
      size: 7.5,
      color: colors.muted,
      font: 'bold',
      align: 'right',
    });

    writeText(money(finalTotal), pageWidth - margin - 6, y + 18, {
      size: 15,
      color: colors.accent,
      font: 'bold',
      align: 'right',
    });

    y += 34;

    drawSectionTitle('Datos de la reserva');

    const cardGap = 5;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const cardHeight = 43;

    drawSmallCard(margin, y, cardWidth, cardHeight, 'Cliente', [
      `Nombre: ${fullName || '-'}`,
      `Teléfono: ${phone || '-'}`,
      `Organización: ${organization || 'Cliente particular'}`,
    ]);

    drawSmallCard(
      margin + cardWidth + cardGap,
      y,
      cardWidth,
      cardHeight,
      'Entrega',
      [`Fecha: ${deliveryDate}`, `Horario: ${deliveryTime}`, `Referencia: ${reference || '-'}`]
    );

    drawSmallCard(
      margin + cardWidth * 2 + cardGap * 2,
      y,
      cardWidth,
      cardHeight,
      'Dirección',
      [address || '-']
    );

    y += cardHeight + 14;

    drawSectionTitle('Resumen del pedido');

    drawTableHeader();

    if (cart.length === 0) {
      doc.setFillColor(...colors.softPurple);
      doc.roundedRect(margin, y, contentWidth, 14, 3, 3, 'F');

      writeText('No hay productos registrados en esta reserva.', margin + 5, y + 9, {
        size: 9,
        color: colors.muted,
        font: 'italic',
      });

      y += 18;
    } else {
      cart.forEach((item, index) => {
        const quantity = Number(item.cartQuantity || 1);
        const price = Number(item.price || 0);
        const subtotal = price * quantity;
        const productName = String(item.name || 'Producto');

        const nameLines = doc.splitTextToSize(productName, 84) as string[];
        const rowHeight = Math.max(11, nameLines.length * 4.7 + 6);

        ensureSpace(rowHeight + 2, true);

        if (index % 2 === 0) {
          doc.setFillColor(...colors.softBg);
          doc.roundedRect(margin, y - 1, contentWidth, rowHeight, 2, 2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.text(nameLines, margin + 5, y + 5);

        writeText(String(quantity), 122, y + 5.5, {
          size: 9,
          color: colors.text,
          align: 'center',
        });

        writeText(money(price), 152, y + 5.5, {
          size: 9,
          color: colors.text,
          align: 'right',
        });

        writeText(money(subtotal), pageWidth - margin - 5, y + 5.5, {
          size: 9,
          color: colors.deepPurple,
          font: 'bold',
          align: 'right',
        });

        doc.setDrawColor(...colors.line);
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowHeight - 1, pageWidth - margin, y + rowHeight - 1);

        y += rowHeight;
      });
    }

    ensureSpace(34);

    y += 5;

    const totalBoxWidth = 72;
    const totalBoxX = pageWidth - margin - totalBoxWidth;

    doc.setFillColor(255, 247, 242);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.35);
    doc.roundedRect(totalBoxX, y, totalBoxWidth, 24, 5, 5, 'FD');

    writeText('TOTAL A PAGAR', totalBoxX + 6, y + 9, {
      size: 8,
      color: colors.text,
      font: 'bold',
    });

    writeText(money(finalTotal), totalBoxX + totalBoxWidth - 6, y + 18, {
      size: 17,
      color: colors.accent,
      font: 'bold',
      align: 'right',
    });

    y += 34;

    ensureSpace(28);

    doc.setFillColor(...colors.deepPurple);
    doc.roundedRect(margin, y, contentWidth, 26, 6, 6, 'F');

    writeText('¡Muchas gracias por tu reserva!', pageWidth / 2, y + 10, {
      size: 13,
      color: colors.white,
      font: 'bold',
      align: 'center',
    });

    writeText(
      'Nos comunicaremos contigo para confirmar los detalles de tu pedido.',
      pageWidth / 2,
      y + 19,
      {
        size: 8.8,
        color: colors.white,
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
                {formatDeliveryDate(date)}
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
                <div className="text-sm opacity-90">+51 920 206 016</div>
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