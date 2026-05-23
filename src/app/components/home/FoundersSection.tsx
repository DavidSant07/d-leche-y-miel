import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Users, Code, X } from 'lucide-react';

const creators = [
  {
    id: 'maria',
    name: 'María González',
    role: 'Fundadora & Chef Pastelera',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&q=80',
    description: 'Con más de 15 años de experiencia en repostería artesanal, María es la mente creativa detrás de cada receta de Leche y Miel.',
  },
  {
    id: 'carlos',
    name: 'Carlos Ramírez',
    role: 'Co-fundador & Maestro Repostero',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80',
    description: 'Especialista en técnicas tradicionales de pastelería, Carlos aporta su conocimiento en la elaboración de productos con miel.',
  },
];

const developers = [
  {
    id: 'ana',
    name: 'Ana Silva',
    role: 'Desarrolladora Full Stack',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces&q=80',
    description: 'Especialista en React y diseño de interfaces de usuario. Creó la experiencia digital de Leche y Miel.',
  },
  {
    id: 'luis',
    name: 'Luis Torres',
    role: 'Desarrollador Backend',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80',
    description: 'Experto en arquitectura de sistemas y bases de datos. Responsable de la infraestructura técnica del proyecto.',
  },
];

export function FoundersSection() {
  const [activeTab, setActiveTab] = useState<'creators' | 'developers'>('creators');
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);

  const currentData = activeTab === 'creators' ? creators : developers;

  return (
    <section id="founders" className="py-20 bg-[#FDFBF7] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#3E2723] mb-4">
            Nuestro Equipo
          </h2>
          <p className="text-xl text-[#6D524A] max-w-2xl mx-auto">
            Haz clic en cada uno para conocer más sobre ellos
          </p>
        </motion.div>

        <div className="flex justify-center mb-16">
          <div className="bg-white p-2 rounded-full inline-flex gap-2 shadow-sm border border-[#E4835D]/10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('creators');
                setSelectedPerson(null);
              }}
              className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${
                activeTab === 'creators'
                  ? 'bg-[#E4835D] text-white shadow-md'
                  : 'text-[#6D524A] hover:bg-gray-50'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Creadores</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('developers');
                setSelectedPerson(null);
              }}
              className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${
                activeTab === 'developers'
                  ? 'bg-[#E4835D] text-white shadow-md'
                  : 'text-[#6D524A] hover:bg-gray-50'
              }`}
            >
              <Code className="h-5 w-5" />
              <span className="hidden sm:inline">Desarrolladores</span>
            </motion.button>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-12 sm:gap-16 items-center min-h-[300px]"
        >
          {currentData.map((person, index) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group cursor-pointer flex flex-col items-center"
              onClick={() => setSelectedPerson(person)}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-40 h-40 md:w-48 md:h-48 rounded-full p-2 bg-white shadow-xl border border-[#E4835D]/20 z-10"
              >
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <motion.div className="absolute inset-0 bg-[#E4835D]/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-[#3E2723] group-hover:text-[#E4835D] transition-colors">
                  {person.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPerson(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl z-50 overflow-hidden"
            >
              <button
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E4835D]/10 rounded-bl-[100px] -z-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#E4835D]/10 rounded-tr-[80px] -z-10" />

              <div className="flex flex-col items-center text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg"
                >
                  <img 
                    src={selectedPerson.image} 
                    alt={selectedPerson.name} 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  className="text-2xl font-bold text-[#3E2723] mb-2"
                >
                  {selectedPerson.name}
                </motion.h3>
                
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  className="inline-block bg-[#E4835D]/10 text-[#E4835D] px-4 py-1.5 rounded-full mb-6 text-sm font-semibold"
                >
                  {selectedPerson.role}
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                  className="text-[#6D524A] leading-relaxed text-lg"
                >
                  {selectedPerson.description}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
