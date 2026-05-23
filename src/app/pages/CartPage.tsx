import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <ShoppingBag className="h-24 w-24 text-[#E4835D]/30 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#3E2723] mb-4">
            Tu carrito está vacío
          </h2>
          <p className="text-[#6D524A] mb-8">
            Agrega algunos de nuestros deliciosos productos para comenzar
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/productos')}
            className="bg-[#E4835D] text-white px-8 py-4 rounded-full hover:bg-[#6D524A] transition-colors shadow-lg"
          >
            Ver Productos
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#3E2723] mb-2">
            Carrito de Compras
          </h1>
          <p className="text-[#6D524A]">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex gap-6">
                    <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#3E2723] mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-[#6D524A] mb-2">
                          {item.category}
                        </p>
                        <p className="text-2xl font-bold text-[#E4835D]">
                          S/. {item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                            className="bg-[#FDFBF7] p-2 rounded-full hover:bg-[#E4835D]/10 transition-colors"
                          >
                            <Minus className="h-4 w-4 text-[#E4835D]" />
                          </motion.button>

                          <span className="text-lg font-semibold text-[#3E2723] min-w-[2rem] text-center">
                            {item.cartQuantity}
                          </span>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                            className="bg-[#FDFBF7] p-2 rounded-full hover:bg-[#E4835D]/10 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-[#E4835D]" />
                          </motion.button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#E4835D]/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6D524A]">Subtotal:</span>
                      <span className="text-xl font-bold text-[#3E2723]">
                        S/. {(item.price * item.cartQuantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 sticky top-24"
            >
              <h2 className="text-2xl font-bold text-[#3E2723] mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#6D524A]">
                      {item.name} x{item.cartQuantity}
                    </span>
                    <span className="text-[#3E2723] font-semibold">
                      S/. {(item.price * item.cartQuantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E4835D]/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[#3E2723]">Total:</span>
                  <span className="text-3xl font-bold text-[#E4835D]">
                    S/. {getTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/pedido')}
                className="w-full bg-[#E4835D] text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-[#6D524A] transition-colors shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                Confirmar Pedido
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/productos')}
                className="w-full mt-4 bg-white text-[#E4835D] py-4 rounded-full border-2 border-[#E4835D] hover:bg-[#E4835D]/5 transition-colors font-semibold"
              >
                Seguir Comprando
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
