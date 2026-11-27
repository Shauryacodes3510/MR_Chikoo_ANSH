import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Heart, Star } from 'lucide-react';

const stats = [
  {
    icon: <Users className="w-5 h-5 text-blue-600" />,
    value: '10K+',
    label: 'Active Learners',
  },
  {
    icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    value: '500+',
    label: 'Interactive Lessons',
  },
  {
    icon: <Heart className="w-5 h-5 text-blue-600" />,
    value: '95%',
    label: 'Satisfaction Rate',
  },
  {
    icon: <Star className="w-5 h-5 text-blue-600" />,
    value: '24/7',
    label: 'AI Tutor Support',
  },
];

export const LandingSocialProof: React.FC = () => {
  return (
    <section id="social-proof" className="py-12 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 lg:p-12 overflow-hidden flex flex-col lg:flex-row items-center justify-between border border-blue-100/60 shadow-sm"
        >
          {/* Left Content */}
          <div className="flex-1 w-full lg:w-auto z-10 mb-10 lg:mb-0">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-10 text-center lg:text-left">
              Why Students <span className="text-blue-600">Love Chikoo</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center lg:items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
                  <div className="text-xs text-slate-600 font-semibold text-center lg:text-left">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content (Mascot and Text) */}
          <div className="relative w-full lg:w-[450px] h-[300px] flex items-center justify-center lg:justify-end z-10">
            {/* Background elements */}
            <div className="absolute top-10 right-10 w-4 h-4 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div
              className="absolute bottom-20 left-10 w-6 h-6 bg-white rounded-full opacity-50 animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>

            {/* Floating Image */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0 left-0 lg:left-[-20px] w-[240px] aspect-[4/5] z-20 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white/60"
            >
              <img
                src="/hand chikoo.png"
                alt="Chikoo Interface"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Learn anytime text */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative z-30 ml-auto lg:mr-8 text-center lg:text-right"
            >
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                Learn <br />
                <span className="text-blue-600">
                  anytime, <br /> anywhere!
                </span>
              </h3>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
