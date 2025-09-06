from flask import Flask, jsonify, request
from flask_mysqldb import MySQL
from flask_cors import CORS, cross_origin
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime, timedelta
import logging
import jwt
from functools import wraps
import os
import json

# Import our models and utilities
from models import AIModels, RecommendationEngine, PricingOptimizer, TravelChatbot

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-super-secret-key-change-this-in-production-make-it-long'
app.config['DEBUG'] = True

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'root'
app.config['MYSQL_DB'] = 'tour_system'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
app.config['MYSQL_CONNECT_TIMEOUT'] = 10

mysql = MySQL(app)

# COMPLETE CORS FIX - Most permissive configuration
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": "*",
        "expose_headers": "*",
        "supports_credentials": False,
        "send_wildcard": True,
        "max_age": 0
    }
})

# Initialize models
ai_models = AIModels()
recommender = RecommendationEngine()
pricing_optimizer = PricingOptimizer()
chatbot = TravelChatbot()

# Handle ALL preflight requests globally
@app.before_request
def handle_preflight():
    # Log all requests for debugging
    logger.info(f"{request.method} {request.path} from {request.headers.get('Origin', 'no-origin')}")
    
    if request.method == "OPTIONS":
        logger.info(f"Handling OPTIONS request for {request.path}")
        response = jsonify({'status': 'ok', 'message': 'CORS preflight successful'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
        response.headers['Access-Control-Max-Age'] = '86400'
        response.headers['Cache-Control'] = 'no-cache'
        return response

# Add CORS headers to every response
@app.after_request
def after_request(response):
    # Force CORS headers on every response
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
    response.headers['Access-Control-Expose-Headers'] = '*'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    # Log response for debugging
    if request.method != 'OPTIONS':
        logger.debug(f"Response to {request.method} {request.path}: {response.status_code}")
    
    return response

# JWT Token Required Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({
                "status": "error",
                "message": "Token is missing"
            }), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({
                "status": "error",
                "message": "Token has expired"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "status": "error",
                "message": "Token is invalid"
            }), 401
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return jsonify({
                "status": "error",
                "message": "Token verification failed"
            }), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Database helper functions
def get_db_cursor():
    try:
        return mysql.connection.cursor()
    except Exception as e:
        logger.error(f"Failed to get database cursor: {str(e)}")
        raise

def close_db_cursor(cursor):
    try:
        if cursor:
            cursor.close()
    except Exception as e:
        logger.error(f"Failed to close cursor: {str(e)}")

# Database initialization
def init_db():
    cur = None
    try:
        try:
            cur = mysql.connection.cursor()
            logger.info("Database connection successful!")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return False
        
        # Enhanced Users Table with AI features
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'guide', 'customer') DEFAULT 'customer',
            age INT DEFAULT NULL,
            city_tier INT DEFAULT 2,
            monthly_income DECIMAL(10,2) DEFAULT NULL,
            occupation VARCHAR(100) DEFAULT NULL,
            gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
            marital_status VARCHAR(50) DEFAULT NULL,
            owns_car BOOLEAN DEFAULT FALSE,
            has_passport BOOLEAN DEFAULT FALSE,
            number_of_trips INT DEFAULT 0,
            customer_segment VARCHAR(50) DEFAULT NULL,
            purchase_probability DECIMAL(5,4) DEFAULT 0.5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Tours Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS tours (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            duration_days INT,
            tour_type VARCHAR(50) DEFAULT 'Standard',
            image_url VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Enhanced Bookings Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            tour_id INT NOT NULL,
            booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            travel_date DATE NOT NULL,
            guests INT NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            ai_suggested_price DECIMAL(10,2) DEFAULT NULL,
            customer_name VARCHAR(100) NOT NULL,
            customer_email VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            special_requests TEXT,
            status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
            package_type VARCHAR(50) NOT NULL,
            preferred_star_rating INT DEFAULT 3,
            number_of_children INT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
        )
        """)
        
        # Reviews Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            tour_id INT,
            rating INT CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            sentiment VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
        )
        """)
        
        # AI Insights Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_insights (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            insight_type ENUM('recommendation', 'pricing', 'segmentation') NOT NULL,
            insight_data JSON,
            confidence_score DECIMAL(5,4) DEFAULT 0.5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        
        # Guides Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS guides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            specialty VARCHAR(100) NOT NULL,
            experience VARCHAR(50) NOT NULL,
            rating DECIMAL(3,2) DEFAULT 4.50,
            languages JSON,
            image_url VARCHAR(255),
            bio TEXT,
            tours_completed INT DEFAULT 0,
            specialities JSON,
            phone VARCHAR(20),
            email VARCHAR(100),
            price_range VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Guide Requests Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS guide_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guide_id INT NOT NULL,
            request_type ENUM('contact', 'booking') NOT NULL,
            customer_name VARCHAR(100) NOT NULL,
            customer_email VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20),
            preferred_date DATE,
            duration VARCHAR(50),
            group_size VARCHAR(20),
            tour_type VARCHAR(100),
            message TEXT NOT NULL,
            status ENUM('pending', 'contacted', 'confirmed', 'cancelled') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
        )
        """)
        
        # Custom Tour Requests Table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS custom_tour_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            customer_name VARCHAR(100) NOT NULL,
            customer_email VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            travel_date DATE,
            number_of_travelers INT NOT NULL,
            duration_days INT NOT NULL,
            budget_level ENUM('low', 'medium', 'high', 'luxury') NOT NULL,
            selected_destinations JSON NOT NULL,
            destination_names JSON,
            estimated_cost DECIMAL(10,2) NOT NULL,
            special_requests TEXT,
            status ENUM('pending', 'reviewed', 'quoted', 'confirmed', 'cancelled') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
        """)
        
        mysql.connection.commit()
        logger.info("Database tables initialized successfully!")
        return True
        
    except pymysql.Error as e:
        logger.error(f"Database Error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        return False
    finally:
        if cur:
            close_db_cursor(cur)

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Resource not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Server Error: {error}")
    return jsonify({
        "status": "error",
        "message": "An internal server error occurred"
    }), 500

# Test endpoint to verify CORS
@app.route('/api/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    return jsonify({
        "status": "success", 
        "message": "CORS is working perfectly!",
        "method": request.method,
        "origin": request.headers.get('Origin', 'No origin header'),
        "timestamp": datetime.now().isoformat(),
        "headers_received": dict(request.headers)
    })

# CORS debug endpoint
@app.route('/api/cors-debug', methods=['GET', 'POST', 'OPTIONS'])
def cors_debug():
    return jsonify({
        "status": "success",
        "message": "CORS debug information",
        "request_info": {
            "method": request.method,
            "path": request.path,
            "origin": request.headers.get('Origin', 'No origin'),
            "user_agent": request.headers.get('User-Agent', 'No user agent'),
            "content_type": request.headers.get('Content-Type', 'No content type'),
            "all_headers": dict(request.headers)
        },
        "server_time": datetime.now().isoformat()
    })

# Import routes AFTER defining app
from routes import register_routes
register_routes(app, mysql, ai_models, recommender, pricing_optimizer, chatbot, 
               token_required, get_db_cursor, close_db_cursor, logger)

# Initialize application
def initialize_app():
    """Initialize the app with database and AI models"""
    if not hasattr(app, 'initialized'):
        logger.info("Initializing Sri Lanka AI-powered tour system...")
        
        if init_db():
            logger.info("Database initialized successfully")
        else:
            logger.error("Database initialization failed")
        
        # Try to load pre-trained models
        if ai_models.load_models():
            logger.info("AI models loaded successfully!")
        else:
            logger.warning("AI models not found. Train models using /api/train-models")
        
        app.initialized = True

# Initialize on first request only
@app.before_request
def check_initialization():
    if not hasattr(app, 'initialized'):
        initialize_app()

@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    return jsonify({
        "status": "success",
        "message": "Sri Lanka AI-Powered Tour System API",
        "country": "Sri Lanka - Pearl of the Indian Ocean",
        "server_status": {
            "running": True,
            "cors_enabled": True,
            "debug_mode": True,
            "timestamp": datetime.now().isoformat()
        },
        "ai_features": {
            "models_loaded": ai_models.is_loaded,
            "ready_for_ai": ai_models.is_loaded
        },
        "test_endpoints": {
            "health_check": "GET /api/health (from routes.py)",
            "cors_test": "GET /api/test-cors", 
            "cors_debug": "GET /api/cors-debug",
            "guides_list": "GET /api/guides",
            "seed_guides": "GET /api/seed-guides"
        },
        "main_endpoints": {
            "auth": {
                "register": "POST /api/auth/register",
                "login": "POST /api/auth/login"
            },
            "guides": {
                "all_guides": "GET /api/guides",
                "guide_details": "GET /api/guides/<id>",
                "guide_requests": "GET/POST /api/guide-requests",
                "update_request": "PUT /api/guide-requests/<id>"
            },
            "custom_tours": {
                "create_request": "POST /api/custom-tour-requests",
                "get_requests": "GET /api/custom-tour-requests",
                "update_request": "PUT /api/custom-tour-requests/<id>"
            },
            "core": {
                "tours": "GET /api/tours",
                "bookings": "GET/POST /api/bookings",
                "tour_details": "GET /api/tours/<id>"
            },
            "utilities": {
                "seed": "GET /api/seed",
                "seed_sri_lanka": "GET /api/seed-sri-lanka",
                "test_db": "GET /api/test-db",
                "chat": "POST /api/chat"
            }
        },
        "quick_start_guide": {
            "step1": "Test CORS: Visit /api/health in browser",
            "step2": "Seed guides: Visit /api/seed-guides", 
            "step3": "Load destinations: Visit /api/seed-sri-lanka",
            "step4": "Check data: Visit /api/guides",
            "step5": "Test frontend: Refresh your React app"
        }
    })

if __name__ == '__main__':
    print("=" * 80)
    print("🇱🇰 STARTING SRI LANKA TOURISM API SERVER")
    print("=" * 80)
    print("📍 Server will be accessible at:")
    print("   • http://localhost:5000")
    print("   • http://127.0.0.1:5000") 
    print("   • http://0.0.0.0:5000")
    print()
    print("🔧 Configuration:")
    print("   • CORS: FULLY OPEN (all origins allowed)")
    print("   • Cache: DISABLED")
    print("   • Debug: ENABLED") 
    print("   • Threading: ENABLED")
    print()
    print("📍 Test these URLs in your browser FIRST:")
    print("   • http://localhost:5000/api/health")
    print("   • http://localhost:5000/api/test-cors")
    print("   • http://localhost:5000/api/guides")
    print()
    print("🔧 If browser tests work but React still fails:")
    print("   1. Clear browser cache (Ctrl+Shift+Delete)")
    print("   2. Try incognito/private mode")
    print("   3. Restart your React dev server")
    print("   4. Check browser console for specific errors")
    print()
    print("💡 Quick database setup:")
    print("   • Visit: http://localhost:5000/api/seed-guides")
    print("   • Visit: http://localhost:5000/api/seed-sri-lanka") 
    print("=" * 80)
    
    logger.info("Starting Sri Lanka AI-powered tour system with comprehensive CORS fix...")
    
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True,
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        print(f"❌ Server failed to start: {e}")
        print("💡 Common solutions:")
        print("   • Check if port 5000 is already in use")
        print("   • Try running with: python -u app.py")
        print("   • Check firewall settings")