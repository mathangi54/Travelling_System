import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setEmailError(true);
      return;
    }
    
    setEmailError(false);
    alert('Thank you for subscribing to our newsletter!');
    setEmail('');
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <span className="text-blue-400 mr-2"><i className="fas fa-compass"></i></span> Travel Explorer
            </h3>
            <p className="text-gray-400 mb-6">
              We specialize in creating unforgettable travel experiences with local guides and fully customizable packages. Discover the world your way.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="social-icon text-gray-400 hover:text-blue-400 text-xl">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon text-gray-400 hover:text-blue-400 text-xl">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon text-gray-400 hover:text-blue-400 text-xl">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon text-gray-400 hover:text-blue-400 text-xl">
                <i className="fab fa-pinterest-p"></i>
              </a>
              <a href="#" className="social-icon text-gray-400 hover:text-blue-400 text-xl">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Home</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Destinations</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Tour Packages</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Local Guides</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Custom Tour</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Contact Us</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="footer-link text-gray-400 hover:text-white">Travel Insurance</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to get updates on new destinations, special offers, and travel tips.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="flex mb-2">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className={`px-4 py-3 rounded-l-md text-gray-800 w-full focus:outline-none focus:ring-2 ${emailError ? 'ring-red-500' : 'focus:ring-blue-500'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit"
                  className="newsletter-btn bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-r-md font-medium"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              {emailError && (
                <p className="text-red-400 text-sm mt-1">Please enter a valid email address</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            &copy; {currentYear} Travel Explorer. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm mr-2">We accept:</span>
            <i className="fab fa-cc-visa payment-method text-2xl"></i>
            <i className="fab fa-cc-mastercard payment-method text-2xl"></i>
            <i className="fab fa-cc-amex payment-method text-2xl"></i>
            <i className="fab fa-cc-paypal payment-method text-2xl"></i>
            <i className="fab fa-cc-apple-pay payment-method text-2xl"></i>
          </div>
          
          <div className="mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">App coming soon to</span>
            <div className="flex space-x-2 mt-1">
              <i className="fab fa-app-store-ios payment-method text-xl"></i>
              <i className="fab fa-google-play payment-method text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .social-icon {
          transition: all 0.3s ease;
        }
        
        .social-icon:hover {
          transform: translateY(-3px);
        }
        
        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .footer-link:after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #3B82F6;
          transition: width 0.3s ease;
        }
        
        .footer-link:hover:after {
          width: 100%;
        }
        
        .payment-method {
          filter: grayscale(100%);
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        
        .payment-method:hover {
          filter: grayscale(0%);
          opacity: 1;
        }
        
        .newsletter-btn {
          transition: all 0.3s ease;
        }
        
        .newsletter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </footer>
  );
};

export default Footer;