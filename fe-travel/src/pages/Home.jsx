import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import PopularPackages from '../components/PopularPackages'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'
import Experience from '../components/Experience'

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
     
      <main className="flex-grow">
        <HeroSection />       
        <PopularPackages />
        <Experience/>
        <Testimonials />
      </main>
      
    </div>
  )
}

export default Home