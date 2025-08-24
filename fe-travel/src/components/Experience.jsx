import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiUsers, FiCoffee } from 'react-icons/fi';

const Experience = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 14
      }
    }
  };

  const stats = [
    {
      id: 1,
      icon: <FiAward className="w-8 h-8" />,
      number: "15+",
      title: "Years of Excellence",
      description: "Delivering authentic flavors since 2008",
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      id: 2,
      icon: <FiUsers className="w-8 h-8" />,
      number: "10K+",
      title: "Happy Customers",
      description: "Satisfied guests and counting",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      id: 3,
      icon: <FiCoffee className="w-8 h-8" />,
      number: "50+",
      title: "Menu Items",
      description: "Carefully crafted dishes",
      color: "text-rose-500",
      bg: "bg-rose-50"
    }
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-rose-400"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full mb-4">
            Our Legacy
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            A Decade of Culinary Excellence
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We take pride in our journey, our craft, and the smiles we've created along the way.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={item}
              whileHover={{ y: -10 }}
              className={`p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 ${stat.color} border-t-4`}
            >
              <div className={`w-16 h-16 ${stat.bg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              
              <motion.p 
                className="text-5xl font-bold text-center mb-3 text-gray-900"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {stat.number}
              </motion.p>
              
              <h3 className="text-xl font-semibold text-center mb-2 text-gray-900">
                {stat.title}
              </h3>
              <p className="text-gray-600 text-center">
                {stat.description}
              </p>
              
              <div className="mt-6 flex justify-center">
                <div className={`h-1 w-16 ${stat.bg} rounded-full`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated decorative dots */}
        <motion.div 
          className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-amber-100 opacity-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />
        <motion.div 
          className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-100 opacity-30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        />
      </div>
    </section>
  );
};

export default Experience;