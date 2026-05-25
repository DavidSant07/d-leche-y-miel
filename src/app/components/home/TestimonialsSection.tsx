import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Send,
  User,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store';

type Review = {
  id: string;
  customer_name: string;
  comment: string;
  rating: number;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const fallbackTestimonials: Review[] = [
  {
    id: '1',
    customer_name: 'Patricia Mendoza',
    photo_url:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    comment:
      'Los productos de Leche y Miel son simplemente espectaculares. La torta de miel que pedí para mi cumpleaños fue la sensación de la fiesta. ¡Todos querían saber dónde la compré!',
    rating: 5,
    status: 'approved',
    created_at: '',
  },
  {
    id: '2',
    customer_name: 'Roberto Vargas',
    photo_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    comment:
      'Excelente calidad y sabor. Los alfajores son los mejores que he probado. El servicio de entrega es muy puntual y profesional.',
    rating: 5,
    status: 'approved',
    created_at: '',
  },
  {
    id: '3',
    customer_name: 'Carmen López',
    photo_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    comment:
      'Me encanta que usen ingredientes naturales y de calidad. Los cupcakes son una delicia y perfectos para cualquier ocasión. ¡Altamente recomendado!',
    rating: 5,
    status: 'approved',
    created_at: '',
  },
];

export function TestimonialsSection() {
  const user = useAppStore((state) => state.user);

  const [testimonials, setTestimonials] =
    useState<Review[]>(fallbackTestimonials);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const currentTestimonial = testimonials[currentIndex];

  const loadApprovedReviews = async () => {
    setIsLoadingReviews(true);

    const { data, error } = await supabase
      .from('reviews')
      .select('id, customer_name, comment, rating, photo_url, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando comentarios:', error.message);
      setTestimonials(fallbackTestimonials);
      setIsLoadingReviews(false);
      return;
    }

    if (data && data.length > 0) {
      setTestimonials(data as Review[]);
      setCurrentIndex(0);
    } else {
      setTestimonials(fallbackTestimonials);
      setCurrentIndex(0);
    }

    setIsLoadingReviews(false);
  };

  useEffect(() => {
    void loadApprovedReviews();
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    const cleanComment = comment.trim();

    if (!cleanComment) {
      toast.error('Escribe tu comentario');
      return;
    }

    if (cleanComment.length < 10) {
      toast.error('Tu comentario debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const cleanName =
      profile?.full_name?.trim() ||
      user.name?.trim() ||
      user.email?.split('@')[0] ||
      'Cliente';

    const profilePhotoUrl = profile?.avatar_url?.trim() || null;

    const { error } = await supabase.from('reviews').insert({
      customer_name: cleanName,
      comment: cleanComment,
      rating,
      photo_url: profilePhotoUrl,
      status: 'pending',
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'No se pudo enviar el comentario');
      return;
    }

    setComment('');
    setRating(5);

    toast.success(
      'Gracias por tu comentario. Será revisado antes de aparecer en la página.'
    );
  };

  const renderStars = (value: number, size = 'h-5 w-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < value ? 'fill-[#C161E4] text-[#C161E4]' : 'text-[#E6C2F3]'
        }`}
      />
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-[#FDFBF7] to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#C161E4] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#301438] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#301438] mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>

          <p className="text-xl text-[#623B6B] max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mayor recompensa
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial?.id || currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
              >
                <Quote className="h-12 w-12 text-[#C161E4]/20 mb-6" />

                {isLoadingReviews ? (
                  <p className="text-xl text-[#623B6B] leading-relaxed mb-8 italic">
                    Cargando comentarios...
                  </p>
                ) : (
                  <>
                    <p className="text-xl text-[#623B6B] leading-relaxed mb-8 italic">
                      "{currentTestimonial.comment}"
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[#E6C2F3]/40 shadow-lg bg-[#FDF7FF]">
                          {currentTestimonial.photo_url ? (
                            <img
                              src={currentTestimonial.photo_url}
                              alt={currentTestimonial.customer_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-12 w-12 text-[#C161E4]" />
                            </div>
                          )}
                        </div>

                        <div className="absolute -bottom-2 -right-2 bg-[#C161E4] rounded-xl p-2 shadow-md">
                          <Quote className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-2xl font-bold text-[#301438] mb-2">
                          {currentTestimonial.customer_name}
                        </h4>

                        <div className="flex justify-center sm:justify-start gap-1">
                          {renderStars(currentTestimonial.rating)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {testimonials.length > 1 && (
              <>
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-16">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToPrevious}
                    className="bg-white text-[#C161E4] p-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-[#E6C2F3]/40"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-16">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToNext}
                    className="bg-white text-[#C161E4] p-4 rounded-full shadow-xl hover:shadow-2xl transition-all border-2 border-[#E6C2F3]/40"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                </div>
              </>
            )}
          </div>

          {testimonials.length > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.id}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-12 bg-[#C161E4]'
                      : 'w-3 bg-[#E6C2F3]/70 hover:bg-[#C161E4]/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mt-16 bg-white rounded-3xl shadow-xl border border-[#E6C2F3]/30 p-6 md:p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6C2F3]/20 mb-4">
                <MessageSquare className="h-8 w-8 text-[#C161E4]" />
              </div>

              <h3 className="text-3xl font-bold text-[#301438] mb-2">
                Deja tu comentario
              </h3>

              <p className="text-[#623B6B]">
                Tu comentario será revisado antes de aparecer públicamente.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#301438] mb-2">
                  Calificación
                </label>

                <div className="flex gap-2 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      className="p-1"
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`h-10 w-10 transition-all ${
                          starValue <= rating
                            ? 'fill-[#C161E4] text-[#C161E4]'
                            : 'text-[#E6C2F3]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#301438] mb-2">
                  Comentario
                </label>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#E6C2F3] focus:outline-none transition-colors resize-none"
                  placeholder="Cuéntanos cómo fue tu experiencia..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C161E4] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#301438] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="h-5 w-5" />
                {isSubmitting ? 'Enviando...' : 'Enviar comentario'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}