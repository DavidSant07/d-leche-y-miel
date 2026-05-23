import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store';

export function FeaturedProductsSection() {
  const navigate = useNavigate();
  const products = useAppStore((state) => state.products);
  const featuredProducts = products.slice(0, 3);

  return (
    <section className="py-24 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-4">
            Productos Destacados
          </h2>
          <p className="text-xl text-[#6D524A] max-w-2xl mx-auto">
            Descubre nuestros productos más populares, elaborados con amor y los mejores ingredientes
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          {featuredProducts.slice(0, 3).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => navigate(`/productos/${product.id}`)}
              className="group cursor-pointer relative bg-white border border-[#E4835D]/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(228,131,93,0.15)] hover:-translate-y-1.5 hover:border-[#E4835D]/30 transition-all duration-500 ease-out flex flex-col md:flex-row h-auto md:h-[260px]"
            >
              {/* Global Hover Background Image */}
              <div className="absolute inset-0 z-0 bg-white pointer-events-none">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700 ease-in-out"
                />
              </div>

              {/* Left Side - Always visible product image */}
              <div className="relative z-10 w-full md:w-[320px] shrink-0 p-4 md:p-6 pb-0 md:pb-6 flex items-center justify-center">
                <div className="w-full h-48 md:h-full rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-500 bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="relative z-10 flex-1 flex flex-col justify-between p-6 md:p-8 md:pl-2">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#3E2723] mb-3 group-hover:text-[#E4835D] transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-lg text-[#6D524A] leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-2">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex justify-end mt-auto pt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/productos/${product.id}`);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-3 rounded-full border-2 border-[#E4835D] text-[#E4835D] font-medium group-hover:bg-[#E4835D] group-hover:text-white transition-all duration-300"
                  >
                    Ver detalle
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/productos')}
            className="bg-[#6D524A] text-white px-8 py-4 rounded-full hover:bg-[#3E2723] transition-colors shadow-lg font-medium"
          >
            Ver Todos los Productos
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
