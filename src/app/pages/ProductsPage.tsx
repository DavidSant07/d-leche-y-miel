import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, Filter, X } from 'lucide-react';
import { useAppStore } from '../store';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export function ProductsPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const products = useAppStore((state) => state.products);
  const storeCategories = useAppStore((state) => state.categories);
  const categories = ['Todas', ...storeCategories];
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts =
    selectedCategory === 'Todas'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`, {
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-4">
            Nuestros Productos
          </h1>
          <p className="text-xl text-[#6D524A] max-w-2xl mx-auto">
            Explora nuestra selección de postres artesanales elaborados con amor
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#3E2723]">Filtrar por categoría</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 text-[#E4835D]"
            >
              <Filter className="h-5 w-5" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{ height: showFilters || window.innerWidth >= 768 ? 'auto' : 0 }}
            className="overflow-hidden md:overflow-visible"
          >
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full transition-all ${
                    selectedCategory === category
                      ? 'bg-[#E4835D] text-white shadow-lg'
                      : 'bg-white text-[#6D524A] hover:bg-[#E4835D]/10 border border-[#E4835D]/20'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigate(`/productos/${product.id}`)}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative aspect-square overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-4 right-4 bg-[#E4835D] text-white px-3 py-1 rounded-full text-sm font-medium">
                    {product.category}
                  </div>

                  {product.allergens.nuts && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Contiene nueces
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#3E2723] mb-2 group-hover:text-[#E4835D] transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-sm text-[#6D524A] mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-[#E4835D]">
                      S/. {product.price.toFixed(2)}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full bg-[#E4835D] text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-[#6D524A] transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Agregar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-2xl text-[#6D524A]">
              No hay productos en esta categoría
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
