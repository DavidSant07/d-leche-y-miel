import { motion } from 'motion/react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  Check,
  X,
  Play,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

type ProductVideo = {
  title: string;
  thumbnail: string;
  video: string;
  description: string;
};

const fallbackVideoThumbnails = [
  'https://images.unsplash.com/photo-1556910103-1c02745a872e?w=800&q=80',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
  'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800&q=80',
];

const fallbackVideoTitles = ['Preparación', 'Exhibición', 'Degustación'];

const defaultAllergenLabels: Record<string, string> = {
  gluten: 'gluten',
  lactose: 'lactosa',
  nuts: 'frutos secos',
};

const getVideoUrlType = (url: string) => {
  const cleanUrl = url.toLowerCase();

  if (
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be') ||
    cleanUrl.includes('vimeo.com')
  ) {
    return 'iframe';
  }

  return 'video';
};

const getEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsedUrl.pathname.includes('/embed/')) {
        return url;
      }
    }

    if (parsedUrl.hostname.includes('player.vimeo.com')) {
      return url;
    }

    if (parsedUrl.hostname.includes('vimeo.com')) {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
};

const normalizeProductVideos = (product: any): ProductVideo[] => {
  const rawVideos = Array.isArray(product.videos) ? product.videos : [];

  const normalizedVideos = rawVideos
    .map((videoItem: any, index: number) => {
      if (typeof videoItem === 'string') {
        return {
          title: fallbackVideoTitles[index] || `Video ${index + 1}`,
          thumbnail:
            fallbackVideoThumbnails[index] ||
            product.image ||
            fallbackVideoThumbnails[0],
          video: videoItem,
          description: `Mira el video de ${product.name}.`,
        };
      }

      return {
        title:
          videoItem?.title?.trim() ||
          fallbackVideoTitles[index] ||
          `Video ${index + 1}`,
        thumbnail:
          videoItem?.thumbnail?.trim() ||
          product.galleryImages?.[index] ||
          product.referenceImages?.[index] ||
          product.image ||
          fallbackVideoThumbnails[index] ||
          fallbackVideoThumbnails[0],
        video: videoItem?.video?.trim() || '',
        description:
          videoItem?.description?.trim() ||
          `Mira el video de ${product.name}.`,
      };
    })
    .filter((videoItem: ProductVideo) => videoItem.video);

  if (normalizedVideos.length > 0) {
    return normalizedVideos;
  }

  if (product.video) {
    return [
      {
        title: 'Preparación',
        thumbnail: product.image || fallbackVideoThumbnails[0],
        video: product.video,
        description: `Mira el video de ${product.name}.`,
      },
    ];
  }

  return [];
};

const getAllergenEntries = (allergens: any) => {
  if (!allergens || typeof allergens !== 'object') {
    return [];
  }

  return Object.entries(allergens).map(([key, value]) => ({
    key,
    label: defaultAllergenLabels[key] || key,
    contains: Boolean(value),
  }));
};

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const products = useAppStore((state) => state.products);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null);

  const product = products.find((p) => p.id === id) as any;

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#3E2723] mb-4">
            Producto no encontrado
          </h2>

          <button
            onClick={() => navigate('/productos')}
            className="text-[#E4835D] hover:underline"
          >
            Volver a productos
          </button>
        </div>
      </div>
    );
  }

  const galleryImages =
    Array.isArray(product.galleryImages) && product.galleryImages.length > 0
      ? product.galleryImages
      : [
          product.image,
          ...(Array.isArray(product.referenceImages)
            ? product.referenceImages
            : []),
        ].filter(Boolean);

  const safeGalleryImages =
    galleryImages.length > 0 ? galleryImages : [product.image].filter(Boolean);

  const productVideos = normalizeProductVideos(product);
  const allergenEntries = getAllergenEntries(product.allergens);

  const handleAddToCart = () => {
    addToCart(product);
    setShowModal(true);
    toast.success('Producto agregado al carrito');
  };

  const handleContinueShopping = () => {
    setShowModal(false);
    navigate('/productos');
  };

  const handleGoToCart = () => {
    setShowModal(false);
    navigate('/carrito');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={() => navigate('/productos')}
          className="flex items-center gap-2 text-[#6D524A] hover:text-[#E4835D] mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a productos
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex gap-4">
              <div className="flex flex-col gap-4 w-20 sm:w-24 shrink-0">
                {safeGalleryImages.map((img: string, index: number) => (
                  <motion.button
                    key={`${img}-${index}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-[#E4835D] shadow-md ring-2 ring-[#E4835D]/30 ring-offset-2 ring-offset-[#FDFBF7]'
                        : 'border-transparent hover:border-[#E4835D]/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Vista ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>

              <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl relative aspect-[4/5] sm:aspect-square">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={safeGalleryImages[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {productVideos.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-[#3E2723] mb-4">
                  Videos del producto
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {productVideos.map((videoItem, index) => (
                    <motion.button
                      key={`${videoItem.video}-${index}`}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVideo(videoItem)}
                      className="group cursor-pointer flex flex-col gap-2 text-left"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gray-100">
                        <img
                          src={videoItem.thumbnail}
                          alt={videoItem.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />

                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#3E2723] text-center">
                          {videoItem.title}
                        </h3>

                        {videoItem.description && (
                          <p className="text-xs text-[#6D524A] text-center line-clamp-2 mt-1">
                            {videoItem.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <div className="inline-block bg-[#E4835D]/10 text-[#E4835D] px-4 py-2 rounded-full mb-4">
                {product.category}
              </div>

              <h1 className="text-4xl font-bold text-[#3E2723] mb-4">
                {product.name}
              </h1>

              <div className="text-4xl font-bold text-[#E4835D] mb-6">
                S/. {Number(product.price).toFixed(2)}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#3E2723] mb-3">
                  Descripción
                </h3>

                <p className="text-[#6D524A] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.quantity && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#3E2723] mb-3">
                    Cantidad
                  </h3>

                  <p className="text-[#6D524A]">{product.quantity}</p>
                </div>
              )}

              {Array.isArray(product.ingredients) &&
                product.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-[#3E2723] mb-3">
                      Ingredientes
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {product.ingredients.map(
                        (ingredient: string, index: number) => (
                          <span
                            key={`${ingredient}-${index}`}
                            className="bg-[#FDFBF7] px-3 py-1 rounded-full text-sm text-[#6D524A] border border-[#E4835D]/20"
                          >
                            {ingredient}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {Array.isArray(product.flavors) && product.flavors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#3E2723] mb-3">
                    Sabores Disponibles
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map((flavor: string, index: number) => (
                      <span
                        key={`${flavor}-${index}`}
                        className="bg-[#E4835D]/10 px-3 py-1 rounded-full text-sm text-[#E4835D] font-medium"
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {allergenEntries.length > 0 && (
                <div className="mb-6 bg-[#FDFBF7] p-6 rounded-2xl">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-[#E4835D] flex-shrink-0 mt-1" />

                    <div>
                      <h3 className="text-xl font-semibold text-[#3E2723]">
                        Información sobre Alergias
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {allergenEntries.map((allergen) => (
                      <div
                        key={allergen.key}
                        className="flex items-center gap-2"
                      >
                        {allergen.contains ? (
                          <X className="h-5 w-5 text-red-500" />
                        ) : (
                          <Check className="h-5 w-5 text-green-500" />
                        )}

                        <span className="text-[#6D524A]">
                          {allergen.contains
                            ? `Contiene ${allergen.label}`
                            : `Sin ${allergen.label}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full bg-[#E4835D] text-white py-4 rounded-full flex items-center justify-center gap-3 text-lg font-semibold hover:bg-[#6D524A] transition-colors shadow-lg hover:shadow-xl"
              >
                <ShoppingCart className="h-6 w-6" />
                Agregar al Carrito
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-[#3E2723] mb-2">
                ¡Producto Agregado!
              </h3>

              <p className="text-[#6D524A]">
                ¿Deseas seguir comprando o ir al carrito?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToCart}
                className="w-full bg-[#E4835D] text-white py-4 rounded-full hover:bg-[#6D524A] transition-colors font-semibold"
              >
                Ir al Carrito
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinueShopping}
                className="w-full bg-white text-[#E4835D] py-4 rounded-full border-2 border-[#E4835D] hover:bg-[#E4835D]/5 transition-colors font-semibold"
              >
                Seguir Comprando
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-black rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-[#E4835D] transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="aspect-video bg-black">
              {getVideoUrlType(selectedVideo.video) === 'iframe' ? (
                <iframe
                  src={getEmbedUrl(selectedVideo.video)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                  src={selectedVideo.video}
                >
                  Tu navegador no puede reproducir este video.
                </video>
              )}
            </div>

            <div className="p-6 bg-white">
              <h3 className="text-2xl font-bold text-[#3E2723] mb-2">
                {selectedVideo.title}
              </h3>

              <p className="text-[#6D524A] mb-4">
                {selectedVideo.description}
              </p>

              <a
                href={selectedVideo.video}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[#E4835D] font-semibold hover:underline"
              >
                Abrir video en otra pestaña
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}