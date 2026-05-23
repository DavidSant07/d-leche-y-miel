import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Patricia Mendoza',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    comment: 'Los productos de Leche y Miel son simplemente espectaculares. La torta de miel que pedí para mi cumpleaños fue la sensación de la fiesta. ¡Todos querían saber dónde la compré!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Roberto Vargas',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    comment: 'Excelente calidad y sabor. Los alfajores son los mejores que he probado. El servicio de entrega es muy puntual y profesional.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Carmen López',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    comment: 'Me encanta que usen ingredientes naturales y de calidad. Los cupcakes son una delicia y perfectos para cualquier ocasión. ¡Altamente recomendado!',
    rating: 5,
  },
  {
    id: 4,
    name: 'José Fernández',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    comment: 'La atención al cliente es excepcional. Siempre están dispuestos a personalizar los pedidos según tus necesidades. Los brownies son increíbles.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Lucía Torres',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    comment: 'Siempre confío en ellos para mis eventos corporativos. La presentación es impecable y el sabor inigualable. Tienen mucha variedad y siempre sorprenden.',
    rating: 5,
  },
  {
    id: 6,
    name: 'Diego Castro',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    comment: 'Es la primera vez que pido y definitivamente no será la última. Se nota el cariño y la tradición en cada bocado. Mi familia quedó encantada.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#FDFBF7] to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E4835D] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6D524A] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-[#6D524A] max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mayor recompensa
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
            >
              <Quote className="h-12 w-12 text-[#E4835D]/20 mb-6" />

              <p className="text-xl text-[#6D524A] leading-relaxed mb-8 italic">
                "{testimonials[currentIndex].comment}"
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#E4835D]/20 shadow-lg">
                    <img
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#E4835D] rounded-xl p-2 shadow-md">
                    <Quote className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-2xl font-bold text-[#3E2723] mb-2">
                    {testimonials[currentIndex].name}
                  </h4>

                  <div className="flex justify-center sm:justify-start gap-1">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#E4835D] text-[#E4835D]" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-16">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrevious}
                className="bg-white text-[#E4835D] p-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-[#E4835D]/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-16">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="bg-white text-[#E4835D] p-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-[#E4835D]/20"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-12 bg-[#E4835D]'
                    : 'w-3 bg-[#E4835D]/30 hover:bg-[#E4835D]/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
