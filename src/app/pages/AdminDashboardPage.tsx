import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import type { Reservation } from '../store';
import { Navigate } from 'react-router';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  CalendarDays,
  X,
  ListTree,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  Save,
  AlertTriangle,
  Star,
  MessageSquare,
  Clock,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';

type EditingCategory = {
  old: string;
  new: string;
};

type EditingProduct = any | null;

type AllergyItem = {
  key: string;
  label: string;
};

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type Review = {
  id: string;
  customer_name: string;
  comment: string;
  rating: number;
  photo_url: string | null;
  status: ReviewStatus;
  created_at: string;
};

const LOGO_URL =
  'https://file.garden/aJyh9202yxmfpWlA/dLCHEYMEL/logoredondo';

const defaultAllergyItems: AllergyItem[] = [
  { key: 'gluten', label: 'gluten' },
  { key: 'lactose', label: 'lactosa' },
  { key: 'nuts', label: 'frutos secos' },
];

const defaultAllergenValues: Record<string, boolean> = {
  gluten: false,
  lactose: false,
  nuts: false,
};

const getAllergenLabel = (key: string) => {
  if (key === 'gluten') return 'gluten';
  if (key === 'lactose') return 'lactosa';
  if (key === 'nuts') return 'frutos secos';
  return key;
};

const splitTextToList = (value: FormDataEntryValue | null) => {
  return String(value || '')
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const listToText = (value: unknown) => {
  if (!Array.isArray(value)) {
    return '';
  }

  return value.join(', ');
};

const getVideoValue = (
  product: any,
  index: number,
  key: 'title' | 'thumbnail' | 'video' | 'description',
  fallback = ''
) => {
  const videoItem = product?.videos?.[index];

  if (!videoItem) {
    return fallback;
  }

  if (typeof videoItem === 'string') {
    return key === 'video' ? videoItem : fallback;
  }

  return videoItem?.[key] || fallback;
};

const getInitialAllergyItems = (product: any): AllergyItem[] => {
  const currentAllergens = product?.allergens;

  if (
    product?.id &&
    currentAllergens &&
    typeof currentAllergens === 'object'
  ) {
    return Object.keys(currentAllergens).map((key) => ({
      key,
      label: getAllergenLabel(key),
    }));
  }

  return defaultAllergyItems;
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

const formatDeliveryDate = (date: string) => {
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

const getReservationNumber = (res: any) => {
  return (
    res.reservationNumber ||
    res.reservation_number ||
    `RES-${String(res.id || '').substring(0, 8).toUpperCase()}`
  );
};

const formatReviewDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function AdminDashboardPage() {
  const {
    user,
    products,
    categories,
    reservations,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateReservationStatus,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'reservations' | 'products' | 'categories' | 'reviews'
  >('reservations');

  const [editingProduct, setEditingProduct] = useState<EditingProduct>(null);
  const [editingCategory, setEditingCategory] =
    useState<EditingCategory | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [expandedReservation, setExpandedReservation] = useState<string | null>(
    null
  );

  const [allergyItems, setAllergyItems] =
    useState<AllergyItem[]>(defaultAllergyItems);

  const [allergenValues, setAllergenValues] =
    useState<Record<string, boolean>>(defaultAllergenValues);

  const [newAllergenName, setNewAllergenName] = useState('');

  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [actionModal, setActionModal] = useState<{
    title: string;
    message: string;
    type: 'success' | 'danger' | 'warning';
  } | null>(null);

  const loadReviews = async () => {
    if (!user || user.role !== 'admin') {
      return;
    }

    setIsLoadingReviews(true);

    const { data, error } = await supabase
      .from('reviews')
      .select('id, customer_name, comment, rating, photo_url, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando comentarios:', error.message);
      toast.error('No se pudieron cargar los comentarios');
      setIsLoadingReviews(false);
      return;
    }

    setReviews((data || []) as Review[]);
    setIsLoadingReviews(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadReviews();
    }
  }, [user?.role]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const pendingReviewsCount = reviews.filter(
    (review) => review.status === 'pending'
  ).length;

  const approvedReviewsCount = reviews.filter(
    (review) => review.status === 'approved'
  ).length;

  const rejectedReviewsCount = reviews.filter(
    (review) => review.status === 'rejected'
  ).length;

  const openProductEditor = (product: any) => {
    const productAllergens = product?.allergens || {};
    const isExistingProduct = Boolean(product?.id);

    setEditingProduct(product || {});
    setAllergyItems(getInitialAllergyItems(product || {}));
    setAllergenValues(
      isExistingProduct
        ? { ...productAllergens }
        : { ...defaultAllergenValues }
    );
    setNewAllergenName('');
  };

  const closeProductEditor = () => {
    setEditingProduct(null);
    setAllergyItems(defaultAllergyItems);
    setAllergenValues(defaultAllergenValues);
    setNewAllergenName('');
  };

  const handleAddCustomAllergen = () => {
    const cleanName = newAllergenName.trim();

    if (!cleanName) {
      toast.error('Escribe el nombre de la alergia');
      return;
    }

    const exists = allergyItems.some(
      (item) => item.key.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      toast.error('Esa alergia ya existe en este producto');
      return;
    }

    setAllergyItems((current) => [
      ...current,
      {
        key: cleanName,
        label: cleanName,
      },
    ]);

    setAllergenValues((current) => ({
      ...current,
      [cleanName]: false,
    }));

    setNewAllergenName('');
  };

  const handleRemoveAllergen = (key: string) => {
    setAllergyItems((current) => current.filter((item) => item.key !== key));

    setAllergenValues((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
  };

  const getVisibleAllergenValues = () => {
    return allergyItems.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.key] = Boolean(allergenValues[item.key]);
      return acc;
    }, {});
  };

  const handleAddCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanCategory = newCategory.trim();

    if (!cleanCategory) {
      toast.error('Ingresa el nombre de la categoría');
      return;
    }

    if (categories.includes(cleanCategory)) {
      toast.error('La categoría ya existe');
      return;
    }

    addCategory(cleanCategory);
    setNewCategory('');

    setActionModal({
      title: 'Categoría agregada',
      message: 'La nueva categoría se guardó correctamente.',
      type: 'success',
    });
  };

  const handleUpdateCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingCategory) {
      return;
    }

    const cleanCategory = editingCategory.new.trim();

    if (!cleanCategory) {
      toast.error('Ingresa el nuevo nombre de la categoría');
      return;
    }

    if (
      cleanCategory !== editingCategory.old &&
      categories.includes(cleanCategory)
    ) {
      toast.error('La categoría ya existe');
      return;
    }

    updateCategory(editingCategory.old, cleanCategory);
    setEditingCategory(null);

    setActionModal({
      title: 'Categoría actualizada',
      message: 'El nombre de la categoría se actualizó correctamente.',
      type: 'success',
    });
  };

  const handleSaveProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const image = String(formData.get('image') || '').trim();
    const ref1 = String(formData.get('ref1') || '').trim();
    const ref2 = String(formData.get('ref2') || '').trim();
    const ref3 = String(formData.get('ref3') || '').trim();

    if (!image || !ref1 || !ref2 || !ref3) {
      toast.error('Se requieren 4 imágenes: 1 principal y 3 de referencia');
      return;
    }

    const name = String(formData.get('name') || '').trim();
    const price = Number(formData.get('price') || 0);
    const category = String(formData.get('category') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const quantity = String(formData.get('quantity') || '').trim();

    const isFeatured = formData.get('isFeatured') === 'on';
    const featuredBackgroundImage = String(
      formData.get('featuredBackgroundImage') || ''
    ).trim();

    if (!name || !price || !category || !description || !quantity) {
      toast.error('Completa todos los datos del producto');
      return;
    }

    const ingredients = splitTextToList(formData.get('ingredients'));
    const flavors = splitTextToList(formData.get('flavors'));

    const video1Title = String(
      formData.get('video1Title') || 'Preparación'
    ).trim();
    const video1Thumbnail = String(
      formData.get('video1Thumbnail') || image
    ).trim();
    const video1Url = String(formData.get('video1Url') || '').trim();
    const video1Description = String(
      formData.get('video1Description') || ''
    ).trim();

    const video2Title = String(
      formData.get('video2Title') || 'Exhibición'
    ).trim();
    const video2Thumbnail = String(
      formData.get('video2Thumbnail') || ref1
    ).trim();
    const video2Url = String(formData.get('video2Url') || '').trim();
    const video2Description = String(
      formData.get('video2Description') || ''
    ).trim();

    const video3Title = String(
      formData.get('video3Title') || 'Degustación'
    ).trim();
    const video3Thumbnail = String(
      formData.get('video3Thumbnail') || ref2
    ).trim();
    const video3Url = String(formData.get('video3Url') || '').trim();
    const video3Description = String(
      formData.get('video3Description') || ''
    ).trim();

    const videos = [
      {
        title: video1Title || 'Preparación',
        thumbnail: video1Thumbnail || image,
        video: video1Url,
        description: video1Description || `Mira la preparación de ${name}.`,
      },
      {
        title: video2Title || 'Exhibición',
        thumbnail: video2Thumbnail || ref1,
        video: video2Url,
        description: video2Description || `Mira la presentación de ${name}.`,
      },
      {
        title: video3Title || 'Degustación',
        thumbnail: video3Thumbnail || ref2,
        video: video3Url,
        description: video3Description || `Mira la degustación de ${name}.`,
      },
    ].filter((videoItem) => videoItem.video);

    const productData: any = {
      name,
      price,
      category,
      image,
      description,
      quantity,
      ingredients,
      allergens: getVisibleAllergenValues(),
      flavors,
      galleryImages: [image, ref1, ref2, ref3],
      referenceImages: [ref1, ref2, ref3],
      videos,
      isFeatured,
      featuredBackgroundImage: featuredBackgroundImage || image,
    };

    if (editingProduct?.id) {
      updateProduct(editingProduct.id, productData);

      setActionModal({
        title: 'Producto actualizado',
        message: 'Los cambios del producto se guardaron correctamente.',
        type: 'success',
      });
    } else {
      addProduct(productData);

      setActionModal({
        title: 'Producto agregado',
        message: 'El nuevo producto se guardó correctamente en el catálogo.',
        type: 'success',
      });
    }

    closeProductEditor();
  };

  const handleUpdateReviewStatus = async (
    reviewId: string,
    status: ReviewStatus
  ) => {
    const { error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', reviewId);

    if (error) {
      toast.error(error.message || 'No se pudo actualizar el comentario');
      return;
    }

    await loadReviews();

    if (status === 'approved') {
      setActionModal({
        title: 'Comentario aprobado',
        message:
          'El comentario ahora aparecerá en la sección de clientes satisfechos.',
        type: 'success',
      });
    }

    if (status === 'rejected') {
      setActionModal({
        title: 'Comentario rechazado',
        message: 'El comentario no aparecerá públicamente.',
        type: 'warning',
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

    if (error) {
      toast.error(error.message || 'No se pudo eliminar el comentario');
      return;
    }

    await loadReviews();

    setActionModal({
      title: 'Comentario eliminado',
      message: 'El comentario fue eliminado correctamente.',
      type: 'danger',
    });
  };

  const downloadReceipt = async (res: Reservation) => {
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

    const reservationNumber = getReservationNumber(res);

    const emittedAt =
      (res as any).createdAt || (res as any).created_at
        ? new Date((res as any).createdAt || (res as any).created_at)
        : new Date();

    const formattedDate = emittedAt.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = emittedAt.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const deliveryDate = formatDeliveryDate(res.date);
    const deliveryTime = res.time || '12:00 PM - 6:00 PM';

    const customerName = res.guestName || 'Usuario registrado';
    const customerPhone = res.guestPhone || '-';
    const organization = res.organization || 'Cliente particular';
    const address = res.address || '-';
    const reference = res.reference || '-';
    const items = Array.isArray(res.items) ? res.items : [];

    const calculatedTotal = items.reduce((sum: number, item: any) => {
      const quantity = Number(item.cartQuantity || item.quantity || 1);
      const price = Number(item.price || 0);

      return sum + price * quantity;
    }, 0);

    const total = Number(res.total || calculatedTotal || 0);

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

      const lines = doc.splitTextToSize(
        String(text || '-'),
        maxWidth
      ) as string[];

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

    writeText(money(total), pageWidth - margin - 6, y + 18, {
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
      `Nombre: ${customerName}`,
      `Teléfono: ${customerPhone}`,
      `Organización: ${organization}`,
    ]);

    drawSmallCard(
      margin + cardWidth + cardGap,
      y,
      cardWidth,
      cardHeight,
      'Entrega',
      [`Fecha: ${deliveryDate}`, `Horario: ${deliveryTime}`, `Referencia: ${reference}`]
    );

    drawSmallCard(
      margin + cardWidth * 2 + cardGap * 2,
      y,
      cardWidth,
      cardHeight,
      'Dirección',
      [address]
    );

    y += cardHeight + 14;

    drawSectionTitle('Resumen del pedido');

    drawTableHeader();

    if (items.length === 0) {
      doc.setFillColor(...colors.softPurple);
      doc.roundedRect(margin, y, contentWidth, 14, 3, 3, 'F');

      writeText('No hay productos registrados en esta reserva.', margin + 5, y + 9, {
        size: 9,
        color: colors.muted,
        font: 'italic',
      });

      y += 18;
    } else {
      items.forEach((item: any, index: number) => {
        const quantity = Number(item.cartQuantity || item.quantity || 1);
        const price = Number(item.price || 0);
        const subtotal = price * quantity;
        const productName = String(item.name || item.product_name || 'Producto');

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

    writeText(money(total), totalBoxX + totalBoxWidth - 6, y + 18, {
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
    toast.success('Recibo descargado');
  };

  const renderVideoFields = (
    index: number,
    defaultTitle: string,
    defaultThumbnail: string
  ) => {
    const number = index + 1;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h5 className="font-bold text-[#301438] text-sm">Video {number}</h5>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Título del video
          </label>
          <input
            name={`video${number}Title`}
            defaultValue={getVideoValue(
              editingProduct,
              index,
              'title',
              defaultTitle
            )}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
            placeholder={defaultTitle}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            URL del video
          </label>
          <input
            name={`video${number}Url`}
            defaultValue={getVideoValue(editingProduct, index, 'video', '')}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
            placeholder="https://.../video.mp4, YouTube o Vimeo"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Miniatura del video
          </label>
          <input
            name={`video${number}Thumbnail`}
            defaultValue={getVideoValue(
              editingProduct,
              index,
              'thumbnail',
              defaultThumbnail
            )}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
            placeholder="URL de imagen miniatura"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Descripción del video
          </label>
          <textarea
            name={`video${number}Description`}
            defaultValue={getVideoValue(
              editingProduct,
              index,
              'description',
              ''
            )}
            rows={2}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm resize-none"
            placeholder="Descripción breve del video"
          />
        </div>
      </div>
    );
  };

  const renderCatalogExtraFields = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
        <h4 className="font-bold text-[#301438] text-sm">
          Ingredientes, Sabores y Alergias
        </h4>

        <p className="text-xs text-[#623B6B]">
          Puedes escribir ingredientes y sabores separados por comas o en líneas
          diferentes.
        </p>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Ingredientes
          </label>
          <textarea
            name="ingredients"
            defaultValue={listToText(editingProduct?.ingredients)}
            rows={3}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm resize-none"
            placeholder="Harina, Huevos, Miel, Vainilla"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Sabores disponibles
          </label>
          <textarea
            name="flavors"
            defaultValue={listToText(editingProduct?.flavors)}
            rows={2}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm resize-none"
            placeholder="Vainilla, Chocolate, Red Velvet"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-3">
            Información sobre alergias
          </label>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={newAllergenName}
              onChange={(e) => setNewAllergenName(e.target.value)}
              className="flex-1 border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none text-sm"
              placeholder="Ej. maní, soya, huevo, cacao"
            />

            <button
              type="button"
              onClick={handleAddCustomAllergen}
              className="bg-[#E6C2F3] text-[#301438] px-5 py-3 rounded-xl font-bold hover:bg-[#C161E4] hover:text-white transition-all"
            >
              Agregar alergia
            </button>
          </div>

          {allergyItems.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-5 text-center text-sm text-[#623B6B]">
              No hay alergias registradas para este producto. Puedes agregar una
              nueva arriba.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {allergyItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#E6C2F3]"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={Boolean(allergenValues[item.key])}
                      onChange={(e) =>
                        setAllergenValues((current) => ({
                          ...current,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#C161E4]"
                    />

                    <span className="text-sm font-medium text-[#301438]">
                      Contiene {item.label}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveAllergen(item.key)}
                    className="text-red-500 hover:bg-red-50 rounded-lg p-1"
                    title="Eliminar esta alergia"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[#623B6B]/70 mt-2">
            Si marcas una alergia, aparecerá como “Contiene...”. Si no la
            marcas, aparecerá como “Sin...”. Si la eliminas, ya no aparecerá en
            el producto.
          </p>
        </div>
      </div>
    );
  };

  const renderFeaturedFields = () => {
    return (
      <div className="bg-[#FDF7FF] p-4 rounded-2xl border border-[#E6C2F3]/40 space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-[#C161E4] text-[#C161E4]" />
          <h4 className="font-bold text-[#301438] text-sm">
            Producto destacado en inicio
          </h4>
        </div>

        <label className="flex items-start gap-3 cursor-pointer bg-white border border-[#E6C2F3]/40 rounded-xl p-4 hover:border-[#C161E4] transition-all">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={Boolean(editingProduct?.isFeatured)}
            className="mt-1 w-5 h-5 accent-[#C161E4]"
          />

          <div>
            <p className="font-bold text-[#301438]">
              Mostrar este producto en Productos Destacados
            </p>
            <p className="text-sm text-[#623B6B] mt-1">
              Si marcas esta opción, aparecerá en la página inicial. Puedes
              marcar hasta 3 productos para que se vea ordenado.
            </p>
          </div>
        </label>

        <div>
          <label className="block text-xs font-semibold text-[#623B6B] mb-1">
            Imagen de fondo al pasar el mouse
          </label>

          <input
            name="featuredBackgroundImage"
            defaultValue={editingProduct?.featuredBackgroundImage || ''}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
            placeholder="Opcional. Si lo dejas vacío, usará la imagen principal."
          />

          <p className="text-xs text-[#623B6B]/70 mt-2">
            Esta imagen aparecerá suavemente de fondo cuando el cliente pase el
            mouse sobre el producto destacado.
          </p>
        </div>
      </div>
    );
  };

  const renderReviewStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <Star
            key={starValue}
            className={`h-5 w-5 ${
              starValue <= rating
                ? 'fill-[#C161E4] text-[#C161E4]'
                : 'text-[#E6C2F3]'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReviewStatusBadge = (status: ReviewStatus) => {
    if (status === 'approved') {
      return (
        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
          Aprobado
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
          Rechazado
        </span>
      );
    }

    return (
      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
        Pendiente
      </span>
    );
  };

  const renderActionIcon = () => {
    if (actionModal?.type === 'success') {
      return <Check className="h-8 w-8 text-green-600" />;
    }

    if (actionModal?.type === 'warning') {
      return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    }

    return <Trash2 className="h-8 w-8 text-red-600" />;
  };

  const renderActionBackground = () => {
    if (actionModal?.type === 'success') {
      return 'bg-green-50';
    }

    if (actionModal?.type === 'warning') {
      return 'bg-yellow-50';
    }

    return 'bg-red-50';
  };

  const renderActionIconBackground = () => {
    if (actionModal?.type === 'success') {
      return 'bg-green-100';
    }

    if (actionModal?.type === 'warning') {
      return 'bg-yellow-100';
    }

    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-[#301438]">
            Dashboard Admin
          </h1>

          <div className="flex flex-wrap justify-center bg-white rounded-full p-1 shadow-sm border border-[#E6C2F3]/20">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
                activeTab === 'reservations'
                  ? 'bg-[#E6C2F3] text-[#301438] font-bold shadow-sm'
                  : 'text-[#623B6B] hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              Reservas
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
                activeTab === 'products'
                  ? 'bg-[#E6C2F3] text-[#301438] font-bold shadow-sm'
                  : 'text-[#623B6B] hover:bg-gray-50'
              }`}
            >
              <Package className="h-5 w-5" />
              Productos
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
                activeTab === 'categories'
                  ? 'bg-[#E6C2F3] text-[#301438] font-bold shadow-sm'
                  : 'text-[#623B6B] hover:bg-gray-50'
              }`}
            >
              <ListTree className="h-5 w-5" />
              Categorías
            </button>

            <button
              onClick={() => {
                setActiveTab('reviews');
                void loadReviews();
              }}
              className={`relative flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
                activeTab === 'reviews'
                  ? 'bg-[#E6C2F3] text-[#301438] font-bold shadow-sm'
                  : 'text-[#623B6B] hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Comentarios

              {pendingReviewsCount > 0 && (
                <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'reservations' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[#E6C2F3]/20">
            <h2 className="text-2xl font-bold text-[#301438] mb-6">
              Reservas y Pedidos
            </h2>

            {reservations.length === 0 ? (
              <p className="text-[#623B6B]">No hay reservas aún.</p>
            ) : (
              <div className="space-y-4">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="border-2 border-[#E6C2F3]/20 rounded-2xl overflow-hidden bg-white"
                  >
                    <div
                      className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedReservation(
                          expandedReservation === res.id ? null : res.id
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-[#E6C2F3]/20 text-[#301438] font-bold px-3 py-2 rounded-xl text-sm">
                          {getReservationNumber(res)}
                        </div>

                        <div>
                          <p className="font-bold text-[#301438]">
                            {res.guestName || 'Usuario Registrado'}
                          </p>
                          <p className="text-sm text-[#623B6B]">
                            {res.date} • {res.items.length} producto(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            res.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {res.status === 'confirmed'
                            ? 'Confirmado'
                            : 'Pendiente'}
                        </span>

                        <p className="font-bold text-[#C161E4] w-24 text-right">
                          S/. {res.total.toFixed(2)}
                        </p>

                        {expandedReservation === res.id ? (
                          <ChevronUp className="text-[#623B6B]" />
                        ) : (
                          <ChevronDown className="text-[#623B6B]" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedReservation === res.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t-2 border-[#E6C2F3]/20 bg-[#FDFBF7]"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="font-bold text-[#301438] mb-4 border-b pb-2 border-gray-200">
                                Información del Cliente y Entrega
                              </h4>

                              <div className="space-y-2 text-sm text-[#623B6B]">
                                <p>
                                  <strong className="text-[#301438]">
                                    Nombre:
                                  </strong>{' '}
                                  {res.guestName || 'N/A'}
                                </p>

                                <p>
                                  <strong className="text-[#301438]">
                                    Teléfono:
                                  </strong>{' '}
                                  {res.guestPhone || 'N/A'}
                                </p>

                                <p>
                                  <strong className="text-[#301438]">
                                    Organización/Lugar:
                                  </strong>{' '}
                                  {res.organization}
                                </p>

                                <p>
                                  <strong className="text-[#301438]">
                                    Dirección:
                                  </strong>{' '}
                                  {res.address}
                                </p>

                                <p>
                                  <strong className="text-[#301438]">
                                    Referencia:
                                  </strong>{' '}
                                  {res.reference}
                                </p>

                                <p>
                                  <strong className="text-[#301438]">
                                    Fecha y Hora:
                                  </strong>{' '}
                                  {res.date} a las {res.time}
                                </p>
                              </div>

                              <div className="mt-6 flex flex-wrap gap-3">
                                {res.status === 'pending' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateReservationStatus(
                                        res.id,
                                        'confirmed'
                                      );

                                      setActionModal({
                                        title: 'Pedido confirmado',
                                        message:
                                          'La reserva fue marcada como confirmada correctamente.',
                                        type: 'success',
                                      });
                                    }}
                                    className="flex items-center gap-2 bg-[#E6C2F3] text-[#301438] px-4 py-2 rounded-xl font-semibold hover:bg-[#C161E4] hover:text-white transition-colors"
                                  >
                                    <Check className="h-4 w-4" />
                                    Confirmar Pedido
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void downloadReceipt(res);
                                  }}
                                  className="flex items-center gap-2 bg-white border-2 border-[#E6C2F3] text-[#301438] px-4 py-2 rounded-xl font-semibold hover:bg-[#E6C2F3] transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                  Descargar Recibo
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-[#301438] mb-4 border-b pb-2 border-gray-200">
                                Productos Seleccionados
                              </h4>

                              <div className="space-y-3">
                                {res.items.map((item: any, idx: number) => (
                                  <div
                                    key={`${res.id}-${idx}`}
                                    className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>

                                      <div>
                                        <p className="font-semibold text-[#301438] text-sm">
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-[#623B6B]">
                                          Cant: {item.cartQuantity}
                                        </p>
                                      </div>
                                    </div>

                                    <p className="font-bold text-[#C161E4]">
                                      S/.{' '}
                                      {(
                                        item.price * item.cartQuantity
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-[#301438]">
                                  Total a pagar:
                                </span>
                                <span className="font-bold text-xl text-[#C161E4]">
                                  S/. {res.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[#E6C2F3]/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#301438]">
                Gestión de Productos
              </h2>

              <button
                onClick={() => openProductEditor({})}
                className="bg-[#E6C2F3] text-[#301438] px-6 py-2 rounded-full flex items-center gap-2 font-bold hover:bg-[#C161E4] hover:text-white transition-all shadow-md"
              >
                <Plus className="h-5 w-5" />
                Agregar Producto
              </button>
            </div>

            {categories.length === 0 && (
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl mb-6">
                Advertencia: No hay categorías creadas. Debes ir a la pestaña
                "Categorías" para crear al menos una antes de agregar un
                producto.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <div
                  key={product.id}
                  className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col relative hover:border-[#E6C2F3] transition-colors"
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-[#E6C2F3]/20 text-[#301438] text-xs font-bold px-2 py-1 rounded-md w-max">
                      {product.category}
                    </span>

                    {Boolean(product.isFeatured) && (
                      <span className="bg-[#C161E4] text-white text-xs font-bold px-2 py-1 rounded-md w-max inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        Destacado
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-[#301438] mb-1">
                    {product.name}
                  </h3>

                  <p className="text-[#C161E4] font-bold text-lg mb-4">
                    S/. {Number(product.price).toFixed(2)}
                  </p>

                  <div className="flex gap-2 w-full mt-auto">
                    <button
                      onClick={() => openProductEditor(product)}
                      className="flex-1 bg-gray-100 text-[#623B6B] py-2 rounded-xl flex justify-center items-center gap-1 hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      onClick={() => setProductToDelete(product)}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl flex justify-center items-center gap-1 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[#E6C2F3]/20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#301438] mb-6">
              Gestión de Categorías
            </h2>

            <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nombre de la nueva categoría"
                className="flex-1 border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors"
                required
              />

              <button
                type="submit"
                className="bg-[#E6C2F3] text-[#301438] px-6 py-3 rounded-xl font-bold hover:bg-[#C161E4] hover:text-white transition-all whitespace-nowrap"
              >
                Agregar
              </button>
            </form>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-[#E6C2F3]/50 transition-colors"
                >
                  {editingCategory?.old === cat ? (
                    <form
                      onSubmit={handleUpdateCategory}
                      className="flex-1 flex gap-2 mr-4"
                    >
                      <input
                        type="text"
                        value={editingCategory.new}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            new: e.target.value,
                          })
                        }
                        className="flex-1 border-2 border-[#E6C2F3] p-2 rounded-lg outline-none"
                        autoFocus
                      />

                      <button
                        type="submit"
                        className="p-2 bg-[#E6C2F3] text-[#301438] rounded-lg hover:bg-[#C161E4] hover:text-white"
                      >
                        <Save className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="font-medium text-[#301438]">{cat}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setEditingCategory({ old: cat, new: cat })
                          }
                          className="p-2 text-[#623B6B] hover:bg-[#E6C2F3]/20 rounded-lg transition-colors"
                          title="Editar categoría"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (
                              products.some(
                                (product) => product.category === cat
                              )
                            ) {
                              setActionModal({
                                title: 'No se puede eliminar',
                                message:
                                  'Esta categoría tiene productos asociados. Primero cambia o elimina esos productos.',
                                type: 'warning',
                              });
                              return;
                            }

                            setCategoryToDelete(cat);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {categories.length === 0 && (
                <p className="text-center text-[#623B6B] py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  No hay categorías registradas.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[#E6C2F3]/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#301438]">
                  Comentarios de Clientes
                </h2>
                <p className="text-[#623B6B] mt-1">
                  Aprueba solo los comentarios que quieres mostrar en la página.
                </p>
              </div>

              <button
                onClick={() => void loadReviews()}
                className="bg-[#E6C2F3] text-[#301438] px-5 py-3 rounded-xl font-bold hover:bg-[#C161E4] hover:text-white transition-all"
              >
                Actualizar comentarios
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-yellow-700">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700 mt-2">
                  {pendingReviewsCount}
                </p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-green-700">Aprobados</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {approvedReviewsCount}
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-red-700">Rechazados</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {rejectedReviewsCount}
                </p>
              </div>
            </div>

            {isLoadingReviews ? (
              <div className="text-center py-12 text-[#623B6B]">
                Cargando comentarios...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#E6C2F3]/40 rounded-2xl">
                <MessageSquare className="h-12 w-12 text-[#C161E4] mx-auto mb-4" />
                <p className="text-[#623B6B]">
                  Todavía no hay comentarios enviados por clientes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-2 border-gray-100 rounded-2xl p-5 hover:border-[#E6C2F3]/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row gap-5">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FDF7FF] border-2 border-[#E6C2F3]/40 shrink-0">
                          {review.photo_url ? (
                            <img
                              src={review.photo_url}
                              alt={review.customer_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserCircle className="h-10 w-10 text-[#C161E4]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-bold text-[#301438] text-lg">
                              {review.customer_name}
                            </h3>

                            {renderReviewStatusBadge(review.status)}
                          </div>

                          {renderReviewStars(review.rating)}

                          <p className="text-[#623B6B] mt-3 leading-relaxed">
                            “{review.comment}”
                          </p>

                          <div className="flex items-center gap-2 text-xs text-[#623B6B]/70 mt-3">
                            <Clock className="h-4 w-4" />
                            {formatReviewDate(review.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-44">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() =>
                              void handleUpdateReviewStatus(
                                review.id,
                                'approved'
                              )
                            }
                            className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Aprobar
                          </button>
                        )}

                        {review.status !== 'rejected' && (
                          <button
                            onClick={() =>
                              void handleUpdateReviewStatus(
                                review.id,
                                'rejected'
                              )
                            }
                            className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-bold hover:bg-yellow-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Rechazar
                          </button>
                        )}

                        <button
                          onClick={() => void handleDeleteReview(review.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b border-gray-100 z-10">
                <h3 className="text-2xl font-bold text-[#301438]">
                  {editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>

                <button
                  onClick={closeProductEditor}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#301438] mb-1">
                      Nombre del Producto
                    </label>
                    <input
                      name="name"
                      defaultValue={editingProduct.name || ''}
                      required
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors"
                      placeholder="Ej. Torta de Miel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#301438] mb-1">
                      Precio (S/.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      defaultValue={editingProduct.price || ''}
                      required
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#301438] mb-1">
                      Categoría
                    </label>
                    <select
                      name="category"
                      defaultValue={
                        editingProduct.category ||
                        (categories.length > 0 ? categories[0] : '')
                      }
                      required
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors bg-white"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    {categories.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Debes crear categorías primero.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-[#301438] text-sm">
                    Imágenes Obligatorias
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-[#623B6B] mb-1">
                      URL Imagen Principal
                    </label>
                    <input
                      name="image"
                      defaultValue={editingProduct.image || ''}
                      required
                      className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#623B6B] mb-1">
                      URL Imágenes de Galería
                    </label>

                    <div className="space-y-2">
                      <input
                        name="ref1"
                        defaultValue={
                          editingProduct.galleryImages?.[1] ||
                          editingProduct.referenceImages?.[0] ||
                          ''
                        }
                        required
                        className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
                        placeholder="URL Galería 1"
                      />

                      <input
                        name="ref2"
                        defaultValue={
                          editingProduct.galleryImages?.[2] ||
                          editingProduct.referenceImages?.[1] ||
                          ''
                        }
                        required
                        className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
                        placeholder="URL Galería 2"
                      />

                      <input
                        name="ref3"
                        defaultValue={
                          editingProduct.galleryImages?.[3] ||
                          editingProduct.referenceImages?.[2] ||
                          ''
                        }
                        required
                        className="w-full border-2 border-gray-200 p-2.5 rounded-lg focus:border-[#E6C2F3] outline-none text-sm"
                        placeholder="URL Galería 3"
                      />
                    </div>
                  </div>
                </div>

                {renderFeaturedFields()}

                {renderCatalogExtraFields()}

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-[#301438] text-sm">
                    Videos del Producto
                  </h4>

                  <p className="text-xs text-[#623B6B]">
                    Puedes usar enlaces directos .mp4 de File Garden, YouTube o
                    Vimeo. Cada video puede tener su propio título, miniatura y
                    descripción.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {renderVideoFields(
                      0,
                      'Preparación',
                      editingProduct.image || ''
                    )}
                    {renderVideoFields(
                      1,
                      'Exhibición',
                      editingProduct.galleryImages?.[1] ||
                        editingProduct.referenceImages?.[0] ||
                        editingProduct.image ||
                        ''
                    )}
                    {renderVideoFields(
                      2,
                      'Degustación',
                      editingProduct.galleryImages?.[2] ||
                        editingProduct.referenceImages?.[1] ||
                        editingProduct.image ||
                        ''
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#301438] mb-1">
                      Cantidad / Medida
                    </label>
                    <input
                      name="quantity"
                      defaultValue={editingProduct.quantity || ''}
                      required
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors"
                      placeholder="Ej. 1kg, 12 porciones..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#301438] mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingProduct.description || ''}
                      rows={3}
                      required
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#E6C2F3] outline-none transition-colors resize-none"
                      placeholder="Describe el producto..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="w-full bg-[#E6C2F3] text-[#301438] py-4 rounded-xl font-bold text-lg hover:bg-[#C161E4] hover:text-white transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    Guardar Producto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {productToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100"
            >
              <div className="bg-red-50 px-8 py-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>

                <h3 className="text-2xl font-bold text-[#301438]">
                  ¿Eliminar producto?
                </h3>

                <p className="text-[#623B6B] mt-2">
                  Esta acción eliminará el producto de tu catálogo.
                </p>
              </div>

              <div className="px-8 py-6">
                <div className="bg-[#FDFBF7] rounded-2xl p-4 mb-6 border border-gray-100">
                  <p className="text-sm text-[#623B6B] mb-1">
                    Producto seleccionado
                  </p>

                  <p className="font-bold text-[#301438]">
                    {productToDelete.name}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[#623B6B] font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      deleteProduct(productToDelete.id);
                      setProductToDelete(null);

                      setActionModal({
                        title: 'Producto eliminado',
                        message:
                          'El producto fue eliminado correctamente del catálogo.',
                        type: 'danger',
                      });
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {categoryToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100"
            >
              <div className="bg-red-50 px-8 py-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>

                <h3 className="text-2xl font-bold text-[#301438]">
                  ¿Eliminar categoría?
                </h3>

                <p className="text-[#623B6B] mt-2">
                  Esta acción eliminará la categoría seleccionada.
                </p>
              </div>

              <div className="px-8 py-6">
                <div className="bg-[#FDFBF7] rounded-2xl p-4 mb-6 border border-gray-100">
                  <p className="text-sm text-[#623B6B] mb-1">
                    Categoría seleccionada
                  </p>

                  <p className="font-bold text-[#301438]">
                    {categoryToDelete}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[#623B6B] font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      deleteCategory(categoryToDelete);
                      setCategoryToDelete(null);

                      setActionModal({
                        title: 'Categoría eliminada',
                        message: 'La categoría fue eliminada correctamente.',
                        type: 'danger',
                      });
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {actionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E6C2F3]/30"
            >
              <div
                className={`px-8 py-8 text-center ${renderActionBackground()}`}
              >
                <div
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${renderActionIconBackground()}`}
                >
                  {renderActionIcon()}
                </div>

                <h3 className="text-2xl font-bold text-[#301438]">
                  {actionModal.title}
                </h3>

                <p className="text-[#623B6B] mt-2">{actionModal.message}</p>
              </div>

              <div className="px-8 py-6">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="w-full py-3 rounded-xl bg-[#E6C2F3] text-[#301438] font-bold hover:bg-[#C161E4] hover:text-white transition-all shadow-lg"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}