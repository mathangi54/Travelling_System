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
    image: "/images/testimonials/sarah.jpg",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Adventure Seeker",
    comment: "The planning was seamless, and the destinations were mind-blowing. Highly recommend!",
    rating: 5,
    image: "/images/testimonials/michael.jpg",
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Family Traveler",
    comment: "Such a wonderful time with my family. The service was excellent and kid-friendly.",
    rating: 4,
    image: "/images/testimonials/emma.jpg",
  },
  {
    id: 4,
    name: "David Rodriguez",
    role: "Culture Explorer",
    comment: "I got to connect with the local culture in ways I never expected. Truly inspiring!",
    rating: 5,
    image: "/images/testimonials/david.jpg",
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
                    />
                    <p className="text-lg text-gray-700 italic mb-4">“{t.comment}”</p>
                    <div className="mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`inline-block ${
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

          {/* Arrows */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 pl-2 z-10">
            <button
              onClick={goPrev}
              aria-label="Previous"
              className="bg-white p-3 rounded-full shadow-lg hover:bg-purple-100 transition duration-300"
            >
              ←
            </button>
          </div>
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 pr-2 z-10">
            <button
              onClick={goNext}
              aria-label="Next"
              className="bg-white p-3 rounded-full shadow-lg hover:bg-purple-100 transition duration-300"
            >
              →
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-10 space-x-3">
          {Array.from({ length: Math.ceil(testimonials.length / 2) }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i * 2)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-4 h-4 rounded-full ${
                index === i * 2 ? "bg-purple-500 scale-125" : "bg-gray-300"
              } transition-all duration-300`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
