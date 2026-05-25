import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowRight, Star } from 'lucide-react';
import { useAppStore } from '../../store';

export function FeaturedProductsSection() {
  const navigate = useNavigate();
  const products = useAppStore((state) => state.products);

  const selectedFeaturedProducts = products.filter((product: any) =>
    Boolean(product.isFeatured)
  );

  const featuredProducts =
    selectedFeaturedProducts.length > 0
      ? selectedFeaturedProducts.slice(0, 3)
      : products.slice(0, 3);

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
          <div className="inline-flex items-center gap-2 bg-[#E6C2F3]/30 text-[#301438] px-5 py-2 rounded-full font-bold mb-5">
            <Star className="h-5 w-5 fill-[#C161E4] text-[#C161E4]" />
            Selección especial
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#301438] mb-4">
            Productos Destacados
          </h2>

          <p className="text-xl text-[#623B6B] max-w-2xl mx-auto">
            Descubre nuestros productos más populares, elaborados con amor y los
            mejores ingredientes
          </p>
        </motion.div>

        {featuredProducts.length === 0 ? (
          <div className="max-w-3xl mx-auto bg-white border border-[#E6C2F3]/30 rounded-3xl p-10 text-center shadow-sm">
            <h3 className="text-2xl font-bold text-[#301438] mb-3">
              Aún no hay productos destacados
            </h3>
            <p className="text-[#623B6B]">
              Cuando marques productos como destacados desde el administrador,
              aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            {featuredProducts.map((product: any, index) => {
              const hoverBackground =
                product.featuredBackgroundImage || product.image;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => navigate(`/productos/${product.id}`)}
                  className="group cursor-pointer relative bg-white border border-[#E6C2F3]/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_12px_40px_rgba(193,97,228,0.18)] hover:-translate-y-1.5 hover:border-[#C161E4]/50 transition-all duration-500 ease-out flex flex-col md:flex-row h-auto md:h-[260px]"
                >
                  <div className="absolute inset-0 z-0 bg-white pointer-events-none">
                    <img
                      src={hoverBackground}
                      alt={product.name}
                      className="w-full h-full object-cover opacity-0 group-hover:opacity-[0.12] transition-opacity duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>

                  <div className="relative z-10 w-full md:w-[320px] shrink-0 p-4 md:p-6 pb-0 md:pb-6 flex items-center justify-center">
                    <div className="w-full h-48 md:h-full rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-500 bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col justify-between p-6 md:p-8 md:pl-2">
                    <div className="mb-4 md:mb-0">
                      <div className="inline-flex items-center gap-2 bg-[#E6C2F3]/40 text-[#301438] px-3 py-1 rounded-full text-xs font-bold mb-3">
                        <Star className="h-3.5 w-3.5 fill-[#C161E4] text-[#C161E4]" />
                        Destacado
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold text-[#301438] mb-3 group-hover:text-[#C161E4] transition-colors duration-300">
                        {product.name}
                      </h3>

                      <p className="text-lg text-[#623B6B] leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex justify-end mt-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/productos/${product.id}`);
                        }}
                        className="flex items-center justify-center gap-3 px-8 py-3 rounded-full border-2 border-[#C161E4] bg-[#C161E4] text-white font-bold hover:bg-[#301438] hover:border-[#301438] transition-all duration-300 shadow-lg shadow-[#C161E4]/20"
                      >
                        Ver detalle
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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
            className="bg-[#301438] text-white px-8 py-4 rounded-full hover:bg-[#C161E4] transition-colors shadow-xl font-bold"
          >
            Ver Todos los Productos
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}