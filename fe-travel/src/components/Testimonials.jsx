"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Travel Enthusiast",
    comment: "This was one of the best experiences of my life. I loved every second of the journey!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Adventure Seeker",
    comment: "The planning was seamless, and the destinations were mind-blowing. Highly recommend!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Family Traveler",
    comment: "Such a wonderful time with my family. The service was excellent and kid-friendly.",
    rating: 4,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
  },
  {
    id: 4,
    name: "David Rodriguez",
    role: "Culture Explorer",
    comment: "I got to connect with the local culture in ways I never expected. Truly inspiring!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const visibleTestimonials = testimonials.slice(index, index + 2);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 2 >= testimonials.length ? 0 : prev + 2));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i) => setIndex(i);
  const goPrev = () => setIndex((prev) => (prev - 2 < 0 ? testimonials.length - 2 : prev - 2));
  const goNext = () => setIndex((prev) => (prev + 2 >= testimonials.length ? 0 : prev + 2));

  return (
    <section className="relative py-20 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-full opacity-20 blur-2xl z-0"></div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Our Happy Travelers</h2>
        <p className="text-gray-600 mb-12 text-lg">
          Discover how our tours leave a lasting impression on our beloved travelers.
        </p>
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {visibleTestimonials.map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl border-t-4 border-purple-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow-md ring-4 ring-purple-200"
                      onError={(e) => {
                        // First fallback: UI Avatars with person's name
                        if (!e.target.dataset.fallback) {
                          e.target.dataset.fallback = "1";
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=6366f1&color=fff&size=150&rounded=true`;
                        } else if (e.target.dataset.fallback === "1") {
                          // Second fallback: Simple colored avatar
                          e.target.dataset.fallback = "2";
                          e.target.src = `https://via.placeholder.com/150x150/6366f1/ffffff?text=${t.name.charAt(0)}`;
                        } else {
                          // Final fallback: Remove image and show initials
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 border-4 border-white shadow-md ring-4 ring-purple-200 text-white text-2xl font-bold" 
                      style={{ display: 'none' }}
                    >
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-lg text-gray-700 italic mb-4">"{t.comment}"</p>
                    <div className="mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`inline-block text-xl ${
                            i < t.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">{t.name}</h4>
                    <p className="text-sm text-purple-600">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation Arrows */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 pl-2 z-10">
            <button
              onClick={goPrev}
              aria-label="Previous testimonials"
              className="bg-white p-3 rounded-full shadow-lg hover:bg-purple-100 transition duration-300 text-purple-600 font-bold text-xl"
            >
              ←
            </button>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 pr-2 z-10">
            <button
              onClick={goNext}
              aria-label="Next testimonials"
              className="bg-white p-3 rounded-full shadow-lg hover:bg-purple-100 transition duration-300 text-purple-600 font-bold text-xl"
            >
              →
            </button>
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center mt-10 space-x-3">
          {Array.from({ length: Math.ceil(testimonials.length / 2) }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i * 2)}
              aria-label={`Go to testimonials ${i * 2 + 1}-${Math.min(i * 2 + 2, testimonials.length)}`}
              className={`w-4 h-4 rounded-full ${
                index === i * 2 ? "bg-purple-500 scale-125" : "bg-gray-300"
              } transition-all duration-300 hover:bg-purple-400`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;