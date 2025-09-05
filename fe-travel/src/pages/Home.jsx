import React from 'react';
import HeroSection from '../components/HeroSection';
import PopularPackages from '../components/PopularPackages';
import Experience from '../components/Experience';
import Testimonials from '../components/Testimonials';
import RecommendedPackages from '../components/RecommendedPackages';

const Home = () => {
  return (
    <div>
      <HeroSection />
      <PopularPackages />
      <RecommendedPackages />
      <Experience />
      <Testimonials />
    </div>
  );
};

export default Home;