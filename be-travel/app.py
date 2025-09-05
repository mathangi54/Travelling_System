from flask import Flask, jsonify, request
from flask_mysqldb import MySQL
from flask_cors import CORS
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime, timedelta
import logging
import jwt
from functools import wraps
import os
import random
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from textblob import TextBlob
from apscheduler.schedulers.background import BackgroundScheduler
import joblib
import atexit
import json

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

# Configure CORS with more permissive settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})

# Handle preflight OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

# AI Models Storage
class AIModels:
    def __init__(self):
        self.recommendation_model = None
        self.pricing_model = None
        self.segmentation_model = None
        self.similarity_model = None
        self.scaler = None
        self.label_encoders = {}
        self.recommendation_features = []
        self.is_loaded = False
        self.training_results = {}
        
    def load_models(self):
        """Load pre-trained models from files"""
        try:
            models_dir = 'models'
            if not os.path.exists(models_dir):
                logger.warning("Models directory not found. Please train models first.")
                return False
            
            # Load models
            model_files = {
                'recommendation_model.pkl': 'recommendation_model',
                'pricing_model.pkl': 'pricing_model', 
                'segmentation_model.pkl': 'segmentation_model',
                'similarity_model.pkl': 'similarity_model',
                'scaler.pkl': 'scaler',
                'label_encoders.pkl': 'label_encoders'
            }
            
            for filename, attr_name in model_files.items():
                filepath = os.path.join(models_dir, filename)
                if os.path.exists(filepath):
                    setattr(self, attr_name, joblib.load(filepath))
                    logger.info(f"Loaded {filename}")
                else:
                    logger.warning(f"Model file not found: {filename}")
            
            # Load features
            features_file = os.path.join(models_dir, 'features.txt')
            if os.path.exists(features_file):
                with open(features_file, 'r') as f:
                    content = f.read()
                    if "Recommendation Features:" in content:
                        lines = content.split('\n')
                        in_rec_section = False
                        for line in lines:
                            if "Recommendation Features:" in line:
                                in_rec_section = True
                                continue
                            if in_rec_section and line.startswith('- '):
                                feature = line.replace('- ', '').strip()
                                if feature:
                                    self.recommendation_features.append(feature)
            
            # Load training results
            results_file = os.path.join(models_dir, 'training_results.json')
            if os.path.exists(results_file):
                with open(results_file, 'r') as f:
                    self.training_results = json.load(f)
            
            self.is_loaded = True
            logger.info("All AI models loaded successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            self.is_loaded = False
            return False
    
    def predict_purchase_probability(self, customer_profile):
        """Predict purchase probability for a customer"""
        if not self.is_loaded or self.recommendation_model is None:
            return 0.5
        
        try:
            # Prepare feature vector
            feature_vector = np.zeros(len(self.recommendation_features))
            
            # Map customer profile to features
            profile_mapping = {
                'age': 'Age',
                'city_tier': 'CityTier',
                'guests': 'NumberOfPersonVisiting',
                'children': 'NumberOfChildrenVisiting', 
                'income': 'MonthlyIncome',
                'owns_car': 'OwnCar',
                'has_passport': 'Passport',
                'trips': 'NumberOfTrips',
                'satisfaction': 'PitchSatisfactionScore'
            }
            
            for profile_key, feature_key in profile_mapping.items():
                if profile_key in customer_profile and feature_key in self.recommendation_features:
                    idx = self.recommendation_features.index(feature_key)
                    feature_vector[idx] = customer_profile[profile_key]
            
            # Scale features
            feature_vector_scaled = self.scaler.transform([feature_vector])
            
            # Predict probability
            probability = self.recommendation_model.predict_proba(feature_vector_scaled)[0][1]
            return probability
            
        except Exception as e:
            logger.error(f"Error predicting purchase probability: {str(e)}")
            return 0.5
    
    def get_customer_segment(self, customer_profile):
        """Get customer segment for a profile"""
        if not self.is_loaded or self.segmentation_model is None:
            return "Unknown"
        
        try:
            # Prepare features for segmentation
            features = [
                customer_profile.get('age', 35),
                customer_profile.get('income', 50000),
                customer_profile.get('guests', 2),
                customer_profile.get('trips', 1),
                customer_profile.get('satisfaction', 3),
                customer_profile.get('city_tier', 2)
            ]
            
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform([features])
            
            segment = self.segmentation_model.predict(features_scaled)[0]
            return f"Segment_{segment}"
            
        except Exception as e:
            logger.error(f"Error getting customer segment: {str(e)}")
            return "Unknown"
    
    def predict_optimal_price(self, customer_profile, base_price):
        """Predict optimal price for customer"""
        if not self.is_loaded or self.pricing_model is None:
            return base_price
        
        try:
            # This is a simplified version - you might need to adjust based on your pricing model features
            purchase_prob = self.predict_purchase_probability(customer_profile)
            
            # Adjust price based on purchase probability and customer characteristics
            if purchase_prob > 0.7:
                price_multiplier = 1.2  # High probability, can charge more
            elif purchase_prob < 0.3:
                price_multiplier = 0.8  # Low probability, offer discount
            else:
                price_multiplier = 1.0
            
            # Income-based adjustment
            income = customer_profile.get('income', 50000)
            if income > 100000:
                price_multiplier *= 1.1
            elif income < 30000:
                price_multiplier *= 0.9
            
            optimal_price = base_price * price_multiplier
            return max(base_price * 0.6, min(base_price * 2.0, optimal_price))
            
        except Exception as e:
            logger.error(f"Error predicting optimal price: {str(e)}")
            return base_price

# Initialize AI models
ai_models = AIModels()

# Original ML Models (keeping for backward compatibility)
class RecommendationEngine:
    def __init__(self):
        self.model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.user_item_matrix = None
        self.user_ids = []
        self.package_ids = []
        
    def fit(self, bookings, users, packages):
        try:
            self.user_ids = [user['id'] for user in users]
            self.package_ids = [pkg['id'] for pkg in packages]
            
            if not self.user_ids or not self.package_ids:
                logger.warning("No users or packages for recommendation engine")
                return
                
            self.user_item_matrix = np.zeros((len(self.user_ids), len(self.package_ids)))
            
            for booking in bookings:
                try:
                    user_idx = self.user_ids.index(booking['user_id'])
                    package_idx = self.package_ids.index(booking['tour_id'])
                    self.user_item_matrix[user_idx, package_idx] += 1
                except (ValueError, IndexError):
                    continue
            
            if np.sum(self.user_item_matrix) > 0:
                self.model.fit(self.user_item_matrix)
                logger.info("Recommendation engine trained successfully")
            else:
                logger.warning("Not enough data to train recommendation engine")
                
        except Exception as e:
            logger.error(f"Error training recommendation engine: {str(e)}")
    
    def recommend(self, user_id, n_recommendations=5):
        if not self.user_ids or user_id not in self.user_ids:
            return self.get_popular_packages(n_recommendations)
            
        try:
            user_idx = self.user_ids.index(user_id)
            if np.sum(self.user_item_matrix[user_idx]) == 0:
                return self.get_popular_packages(n_recommendations)
                
            distances, indices = self.model.kneighbors(
                [self.user_item_matrix[user_idx]], 
                n_neighbors=min(6, len(self.user_ids))
            )
            
            similar_users = indices[0][1:]
            recommended_packages = []
            
            for similar_user_idx in similar_users:
                user_packages = np.where(self.user_item_matrix[similar_user_idx] > 0)[0]
                for pkg_idx in user_packages:
                    if (self.user_item_matrix[similar_user_idx, pkg_idx] > 0 and 
                        self.user_item_matrix[user_idx, pkg_idx] == 0):
                        recommended_packages.append(self.package_ids[pkg_idx])
                        if len(recommended_packages) >= n_recommendations:
                            break
                if len(recommended_packages) >= n_recommendations:
                    break
                    
            return recommended_packages[:n_recommendations] or self.get_popular_packages(n_recommendations)
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return self.get_popular_packages(n_recommendations)
    
    def get_popular_packages(self, n=5):
        if not self.package_ids or self.user_item_matrix is None:
            return []
            
        try:
            package_sums = np.sum(self.user_item_matrix, axis=0)
            popular_indices = np.argsort(package_sums)[::-1][:n]
            return [self.package_ids[i] for i in popular_indices if i < len(self.package_ids)]
        except:
            return []

class PricingOptimizer:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.is_trained = False
        
    def prepare_data(self, bookings, tours):
        data = []
        for booking in bookings:
            tour = next((t for t in tours if t['id'] == booking['tour_id']), None)
            if tour and 'travel_date' in booking and 'booking_date' in booking:
                try:
                    travel_date = datetime.strptime(str(booking['travel_date']), '%Y-%m-%d')
                    booking_date = datetime.strptime(str(booking['booking_date']), '%Y-%m-%d %H:%M:%S')
                    
                    features = {
                        'month': travel_date.month,
                        'day_of_week': travel_date.weekday(),
                        'duration': tour.get('duration_days', 7),
                        'guests': booking.get('guests', 1),
                        'advance_booking': (travel_date - booking_date).days,
                        'actual_price': booking.get('total_price', 100) / max(1, booking.get('guests', 1))
                    }
                    data.append(features)
                except (ValueError, TypeError):
                    continue
                    
        return pd.DataFrame(data)
    
    def train(self, bookings, tours):
        try:
            df = self.prepare_data(bookings, tours)
            if len(df) < 10:
                self.is_trained = False
                return
                
            X = df[['month', 'day_of_week', 'duration', 'guests', 'advance_booking']]
            y = df['actual_price']
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            self.model.fit(X_train, y_train)
            self.is_trained = True
            logger.info("Pricing optimizer trained successfully")
            
        except Exception as e:
            logger.error(f"Error training pricing optimizer: {str(e)}")
            self.is_trained = False
        
    def predict_optimal_price(self, tour_id, travel_date, guests, base_price):
        if not self.is_trained:
            return base_price
            
        try:
            travel_date = datetime.strptime(travel_date, '%Y-%m-%d')
            features = pd.DataFrame([{
                'month': travel_date.month,
                'day_of_week': travel_date.weekday(),
                'duration': 7,
                'guests': guests,
                'advance_booking': (travel_date - datetime.now()).days
            }])
            
            predicted_price = self.model.predict(features)[0]
            return max(base_price * 0.5, min(base_price * 2, predicted_price))
            
        except Exception as e:
            logger.error(f"Error predicting optimal price: {str(e)}")
            return base_price

# Initialize original models
recommender = RecommendationEngine()
pricing_optimizer = PricingOptimizer()

# Travel Chatbot Class
class TravelChatbot:
    def __init__(self):
        self.responses = self.load_responses()
        
    def load_responses(self):
        return {
            'greeting': [
                "Ayubowan! Welcome to Sri Lanka Tourism. How can I help plan your island adventure today?",
                "Hello! Ready to explore the Pearl of the Indian Ocean? How can I assist you?",
                "Greetings! I'm here to help you discover Sri Lanka's wonders. Where would you like to explore?"
            ],
            'help': [
                "I can help you: find Sri Lankan destinations, check prices, plan itineraries, or answer travel questions about Sri Lanka.",
                "I'm here to assist with: Sri Lankan cultural sites, beaches, wildlife parks, tea country, and local experiences.",
                "I can help with Sri Lankan destination recommendations, local customs, best travel times, and authentic experiences!"
            ],
            'destination': [
                "Sri Lanka offers incredible diversity! Visit Sigiriya Rock Fortress for ancient history and stunning views.",
                "How about Ella in the hill country? Misty mountains, tea plantations, and the famous Nine Arch Bridge await!",
                "Mirissa beach is perfect for whale watching and pristine coastal relaxation.",
                "Kandy's Temple of the Tooth offers deep cultural and spiritual experiences.",
                "Yala National Park provides amazing wildlife safaris - Sri Lanka has the highest leopard density in the world!",
                "The Cultural Triangle with Anuradhapura and Polonnaruwa showcases 2,500 years of Sri Lankan civilization."
            ],
            'booking': [
                "To book your Sri Lankan adventure, please specify: destination, travel dates, and number of travelers.",
                "I can help you book authentic Sri Lankan experiences. Tell me what regions interest you most!",
                "Let's plan your Sri Lankan journey! Please provide: preferred experiences, travel dates, and group size."
            ],
            'price': [
                "Sri Lankan travel offers excellent value! Prices vary by season - December to April is peak season.",
                "I can find the best prices for Sri Lankan experiences. Which region are you most interested in?",
                "Sri Lanka is very affordable compared to other destinations. Tell me your preferences and I'll find great local deals."
            ],
            'thanks': [
                "You're most welcome! Enjoy exploring beautiful Sri Lanka.",
                "My pleasure! Have a wonderful time in the Pearl of the Indian Ocean.",
                "Glad I could help! Safe travels and enjoy Sri Lankan hospitality."
            ],
            'fallback': [
                "I specialize in Sri Lankan travel. Could you ask about our destinations, culture, or experiences?",
                "I'm focused on helping with Sri Lankan travel planning. Try asking about beaches, cultural sites, or wildlife.",
                "I don't have information about that, but I'd love to help with Sri Lankan travel questions!"
            ]
        }
    
    def get_response(self, message):
        message = message.lower()
        
        if any(word in message for word in ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'ayubowan']):
            return random.choice(self.responses['greeting'])
        
        if any(word in message for word in ['thanks', 'thank you', 'appreciate', 'thx', 'bohoma sthuthi']):
            return random.choice(self.responses['thanks'])
        
        if any(word in message for word in ['help', 'what can you do', 'assist', 'support']):
            return random.choice(self.responses['help'])
        
        if any(word in message for word in ['destination', 'place', 'where', 'recommend', 'visit', 'travel to', 'go to', 'sri lanka']):
            return random.choice(self.responses['destination'])
        
        if any(word in message for word in ['book', 'reservation', 'reserve', 'arrange', 'schedule']):
            return random.choice(self.responses['booking'])
        
        if any(word in message for word in ['price', 'cost', 'how much', 'deal', 'discount', 'cheap', 'budget']):
            return random.choice(self.responses['price'])
        
        return random.choice(self.responses['fallback'])

# Initialize chatbot
chatbot = TravelChatbot()

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
        
        # Tours Table (using only standard columns)
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

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Sri Lanka Tourism API is running",
        "timestamp": datetime.now().isoformat()
    })

# MISSING BOOKINGS ENDPOINT - This is what was causing the 404 error
@app.route('/api/bookings', methods=['POST', 'OPTIONS'])
@token_required
def create_booking(current_user):
    if request.method == 'OPTIONS':
        return '', 200
    
    cur = None
    try:
        data = request.get_json()
        logger.info(f"Received booking data: {json.dumps(data, indent=2, default=str)}")
        
        # Validate required fields
        required_fields = ['tour_id', 'travel_date', 'guests', 'total_price', 
                          'customer_name', 'customer_email', 'customer_phone', 'package_type']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Validate data types and ranges
        try:
            tour_id = int(data['tour_id'])
            guests = int(data['guests'])
            total_price = float(data['total_price'])
            travel_date = datetime.strptime(data['travel_date'], '%Y-%m-%d').date()
        except (ValueError, TypeError) as e:
            return jsonify({
                "status": "error",
                "message": f"Invalid data format: {str(e)}"
            }), 400
        
        if guests < 1 or guests > 50:
            return jsonify({
                "status": "error",
                "message": "Number of guests must be between 1 and 50"
            }), 400
        
        if total_price < 0:
            return jsonify({
                "status": "error",
                "message": "Total price cannot be negative"
            }), 400
        
        if travel_date < datetime.now().date():
            return jsonify({
                "status": "error",
                "message": "Travel date cannot be in the past"
            }), 400
        
        cur = get_db_cursor()
        
        # Verify tour exists
        cur.execute("SELECT id, price FROM tours WHERE id = %s", (tour_id,))
        tour = cur.fetchone()
        if not tour:
            return jsonify({
                "status": "error",
                "message": "Tour not found"
            }), 404
        
        # Verify user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (current_user,))
        user = cur.fetchone()
        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404
        
        # Insert booking
        booking_data = {
            'user_id': current_user,
            'tour_id': tour_id,
            'travel_date': travel_date,
            'guests': guests,
            'total_price': total_price,
            'customer_name': data['customer_name'],
            'customer_email': data['customer_email'],
            'customer_phone': data['customer_phone'],
            'special_requests': data.get('special_requests', ''),
            'package_type': data['package_type'],
            'preferred_star_rating': data.get('preferred_star_rating', 3),
            'number_of_children': data.get('number_of_children', 0),
            'status': 'confirmed'  # Auto-confirm for now
        }
        
        # AI pricing if available
        ai_suggested_price = None
        if ai_models.is_loaded:
            try:
                # Get user profile for AI pricing
                cur.execute("SELECT * FROM users WHERE id = %s", (current_user,))
                user_profile = cur.fetchone()
                
                customer_profile = {
                    'age': user_profile.get('age', 35),
                    'city_tier': user_profile.get('city_tier', 2),
                    'income': float(user_profile.get('monthly_income', 50000)) if user_profile.get('monthly_income') else 50000,
                    'owns_car': 1 if user_profile.get('owns_car') else 0,
                    'has_passport': 1 if user_profile.get('has_passport') else 0,
                    'trips': user_profile.get('number_of_trips', 1),
                    'guests': guests,
                    'satisfaction': 4
                }
                
                ai_suggested_price = ai_models.predict_optimal_price(customer_profile, float(tour['price']))
                booking_data['ai_suggested_price'] = ai_suggested_price
                
            except Exception as e:
                logger.warning(f"AI pricing failed: {str(e)}")
        
        # Build dynamic SQL query
        columns = list(booking_data.keys())
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        
        sql = f"INSERT INTO bookings ({columns_str}) VALUES ({placeholders})"
        values = list(booking_data.values())
        
        logger.info(f"Executing SQL: {sql}")
        logger.info(f"With values: {values}")
        
        cur.execute(sql, values)
        booking_id = cur.lastrowid
        mysql.connection.commit()
        
        # Fetch the created booking
        cur.execute("""
            SELECT b.*, t.name as tour_name, t.description as tour_description
            FROM bookings b 
            JOIN tours t ON b.tour_id = t.id 
            WHERE b.id = %s
        """, (booking_id,))
        
        created_booking = cur.fetchone()
        
        logger.info(f"Booking created successfully with ID: {booking_id}")
        
        return jsonify({
            "status": "success",
            "message": "Booking created successfully!",
            "data": {
                "id": booking_id,
                "booking_details": dict(created_booking),
                "ai_insights": {
                    "ai_suggested_price": ai_suggested_price,
                    "pricing_used": "AI-optimized" if ai_suggested_price else "Standard"
                } if ai_suggested_price else None
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        if cur:
            mysql.connection.rollback()
        return jsonify({
            "status": "error",
            "message": f"Failed to create booking: {str(e)}"
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# Get bookings endpoint
@app.route('/api/bookings', methods=['GET'])
@token_required
def get_bookings(current_user):
    cur = None
    try:
        cur = get_db_cursor()
        
        # Get user's bookings with tour details
        cur.execute("""
            SELECT b.*, t.name as tour_name, t.description as tour_description, t.image_url
            FROM bookings b 
            JOIN tours t ON b.tour_id = t.id 
            WHERE b.user_id = %s 
            ORDER BY b.booking_date DESC
        """, (current_user,))
        
        bookings = cur.fetchall()
        
        return jsonify({
            "status": "success",
            "data": [dict(booking) for booking in bookings],
            "count": len(bookings)
        })
        
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# Get specific tour details
@app.route('/api/tours/<int:tour_id>', methods=['GET'])
def get_tour_details(tour_id):
    cur = None
    try:
        cur = get_db_cursor()
        cur.execute("SELECT * FROM tours WHERE id = %s", (tour_id,))
        tour = cur.fetchone()
        
        if not tour:
            return jsonify({
                "status": "error",
                "message": "Tour not found"
            }), 404
        
        # Add location and region info
        tour_dict = dict(tour)
        name_lower = tour_dict['name'].lower()
        
        if 'mirissa' in name_lower:
            tour_dict['location'] = 'Mirissa, Southern Province'
            tour_dict['region'] = 'coastal'
        elif 'ella' in name_lower:
            tour_dict['location'] = 'Ella, Uva Province' 
            tour_dict['region'] = 'hill country'
        elif 'kandy' in name_lower:
            tour_dict['location'] = 'Kandy, Central Province'
            tour_dict['region'] = 'cultural'
        elif 'cultural triangle' in name_lower:
            tour_dict['location'] = 'Cultural Triangle'
            tour_dict['region'] = 'cultural'
        elif 'yala' in name_lower or 'wildlife' in name_lower:
            tour_dict['location'] = 'Yala National Park'
            tour_dict['region'] = 'wilderness'
        elif 'tea country' in name_lower or 'nuwara eliya' in name_lower:
            tour_dict['location'] = 'Nuwara Eliya, Central Province'
            tour_dict['region'] = 'hill country'
        elif 'arugam' in name_lower:
            tour_dict['location'] = 'Arugam Bay, Eastern Province'
            tour_dict['region'] = 'coastal'
        elif 'jaffna' in name_lower:
            tour_dict['location'] = 'Jaffna, Northern Province'
            tour_dict['region'] = 'cultural'
        elif 'trincomalee' in name_lower:
            tour_dict['location'] = 'Trincomalee, Eastern Province'
            tour_dict['region'] = 'coastal'
        elif 'galle' in name_lower:
            tour_dict['location'] = 'Galle, Southern Province'
            tour_dict['region'] = 'cultural'
        elif 'unawatuna' in name_lower:
            tour_dict['location'] = 'Unawatuna, Southern Province'
            tour_dict['region'] = 'coastal'
        elif 'sinharaja' in name_lower:
            tour_dict['location'] = 'Sinharaja, Sabaragamuwa Province'
            tour_dict['region'] = 'wilderness'
        else:
            tour_dict['location'] = 'Sri Lanka'
            tour_dict['region'] = 'cultural'
        
        # Add ratings info
        tour_dict['rating'] = 4.5  # Default rating
        tour_dict['reviews'] = '150+'  # Default reviews
        
        return jsonify({
            "status": "success",
            "data": tour_dict
        })
        
    except Exception as e:
        logger.error(f"Error fetching tour details: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# NEW AI-POWERED ENDPOINTS
@app.route('/api/ai-status', methods=['GET'])
def get_ai_status():
    """Check if AI models are loaded and ready"""
    try:
        status = {
            "models_loaded": ai_models.is_loaded,
            "available_models": {
                "recommendation": ai_models.recommendation_model is not None,
                "pricing": ai_models.pricing_model is not None,
                "segmentation": ai_models.segmentation_model is not None,
                "similarity": ai_models.similarity_model is not None
            },
            "training_results": ai_models.training_results if ai_models.is_loaded else {},
            "feature_count": len(ai_models.recommendation_features),
            "ready_for_predictions": ai_models.is_loaded
        }
        
        return jsonify({
            "status": "success",
            "data": status
        })
        
    except Exception as e:
        logger.error(f"Error getting AI status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/train-models', methods=['POST'])
def train_models():
    """Trigger model training"""
    try:
        logger.info("Training request received...")
        
        # Check if CSV file exists
        csv_path = "tour_package.csv"
        if not os.path.exists(csv_path):
            return jsonify({
                "status": "error",
                "message": f"Training dataset not found: {csv_path}. Please ensure tour_package.csv is in the project root."
            }), 404
        
        # Import and run training
        try:
            from train_tour_package_models import EpochBasedTrainer
        except ImportError:
            return jsonify({
                "status": "error", 
                "message": "Training module not found. Please ensure train_tour_package_models.py is available."
            }), 500
        
        trainer = EpochBasedTrainer(csv_path)
        success = trainer.run_complete_training()
        
        if success:
            # Reload models
            ai_models.load_models()
            
            return jsonify({
                "status": "success",
                "message": "Models trained successfully!",
                "data": {
                    "models_saved": True,
                    "models_loaded": ai_models.is_loaded,
                    "training_timestamp": datetime.now().isoformat()
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Model training failed. Check logs for details."
            }), 500
            
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Training error: {str(e)}"
        }), 500

@app.route('/api/ai-recommendations', methods=['GET'])
@token_required  
def get_ai_recommendations(current_user):
    """Get AI-powered tour recommendations"""
    cur = None
    try:
        if not ai_models.is_loaded:
            return jsonify({
                "status": "error",
                "message": "AI models not loaded. Please train models first."
            }), 503
        
        cur = get_db_cursor()
        
        # Get user profile
        cur.execute("SELECT * FROM users WHERE id = %s", (current_user,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "status": "error", 
                "message": "User not found"
            }), 404
        
        # Create customer profile
        customer_profile = {
            'age': user.get('age', 35),
            'city_tier': user.get('city_tier', 2),
            'income': float(user.get('monthly_income', 50000)) if user.get('monthly_income') else 50000,
            'owns_car': 1 if user.get('owns_car') else 0,
            'has_passport': 1 if user.get('has_passport') else 0,
            'trips': user.get('number_of_trips', 1),
            'guests': 2,
            'satisfaction': 4
        }
        
        # Get AI predictions
        purchase_prob = ai_models.predict_purchase_probability(customer_profile)
        customer_segment = ai_models.get_customer_segment(customer_profile)
        
        # Get tours and apply AI scoring
        cur.execute("SELECT * FROM tours")
        all_tours = cur.fetchall()
        
        scored_tours = []
        for tour in all_tours:
            tour_dict = dict(tour)
            
            # AI-based scoring
            ai_price = ai_models.predict_optimal_price(customer_profile, float(tour['price']))
            
            # Calculate recommendation score based on various factors
            base_score = purchase_prob
            
            # Adjust score based on price sensitivity
            price_ratio = ai_price / float(tour['price'])
            if price_ratio < 0.9:  # Recommended discount
                base_score += 0.1
            elif price_ratio > 1.1:  # Premium pricing
                base_score -= 0.05
            
            tour_dict.update({
                'ai_score': base_score,
                'ai_suggested_price': round(ai_price, 2),
                'purchase_probability': round(purchase_prob, 3),
                'customer_segment': customer_segment,
                'recommendation_reason': f"Matches {customer_segment} profile"
            })
            
            scored_tours.append(tour_dict)
        
        # Sort by AI score and return top recommendations
        scored_tours.sort(key=lambda x: x['ai_score'], reverse=True)
        top_recommendations = scored_tours[:6]
        
        # Update user's AI insights
        cur.execute("""
            UPDATE users 
            SET customer_segment = %s, purchase_probability = %s 
            WHERE id = %s
        """, (customer_segment, purchase_prob, current_user))
        
        # Store AI insight
        cur.execute("""
            INSERT INTO ai_insights (user_id, insight_type, insight_data, confidence_score)
            VALUES (%s, 'recommendation', %s, %s)
        """, (current_user, json.dumps({
            'recommendations': [t['id'] for t in top_recommendations],
            'customer_profile': customer_profile
        }), purchase_prob))
        
        mysql.connection.commit()
        
        return jsonify({
            "status": "success",
            "data": {
                "tours": top_recommendations,
                "ai_insights": {
                    "purchase_probability": round(purchase_prob, 3),
                    "customer_segment": customer_segment,
                    "model_confidence": round(purchase_prob, 3),
                    "personalization_active": True
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting AI recommendations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

@app.route('/api/ai-pricing', methods=['POST'])
def get_ai_pricing():
    """Get AI-optimized pricing"""
    cur = None
    try:
        if not ai_models.is_loaded:
            return jsonify({
                "status": "error",
                "message": "AI models not loaded. Please train models first."
            }), 503
        
        data = request.get_json()
        tour_id = data.get('tour_id')
        user_id = data.get('user_id')
        guests = data.get('guests', 2)
        travel_date = data.get('travel_date')
        
        if not tour_id:
            return jsonify({
                "status": "error",
                "message": "Tour ID is required"
            }), 400
        
        cur = get_db_cursor()
        cur.execute("SELECT * FROM tours WHERE id = %s", (tour_id,))
        tour = cur.fetchone()
        
        if not tour:
            return jsonify({
                "status": "error",
                "message": "Tour not found"
            }), 404
        
        base_price = float(tour['price'])
        
        # Get customer profile if user provided
        customer_profile = {
            'age': 35, 'city_tier': 2, 'income': 50000,
            'owns_car': 0, 'has_passport': 1, 'trips': 1,
            'guests': guests, 'satisfaction': 4
        }
        
        if user_id:
            cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user:
                customer_profile.update({
                    'age': user.get('age', 35),
                    'city_tier': user.get('city_tier', 2),
                    'income': float(user.get('monthly_income', 50000)) if user.get('monthly_income') else 50000,
                    'owns_car': 1 if user.get('owns_car') else 0,
                    'has_passport': 1 if user.get('has_passport') else 0,
                    'trips': user.get('number_of_trips', 1)
                })
        
        # Get AI pricing
        ai_price = ai_models.predict_optimal_price(customer_profile, base_price)
        purchase_prob = ai_models.predict_purchase_probability(customer_profile)
        
        # Apply additional factors (Sri Lankan seasonal patterns)
        seasonal_multiplier = 1.0
        demand_multiplier = 1.0
        
        if travel_date:
            travel_dt = pd.to_datetime(travel_date)
            # Peak season adjustment (Dec-Apr in Sri Lanka)
            if travel_dt.month in [12, 1, 2, 3, 4]:
                seasonal_multiplier = 1.15
            elif travel_dt.month in [5, 6, 9, 10, 11]:  # Shoulder season
                seasonal_multiplier = 0.95
            else:  # Monsoon season (Jul-Aug)
                seasonal_multiplier = 0.85
        
        # Check demand for the date
        if travel_date:
            cur.execute("""
                SELECT COUNT(*) as bookings
                FROM bookings 
                WHERE travel_date = %s AND status = 'confirmed'
            """, (travel_date,))
            result = cur.fetchone()
            bookings_count = result['bookings'] if result else 0
            
            if bookings_count > 10:
                demand_multiplier = 1.25
            elif bookings_count > 5:
                demand_multiplier = 1.1
        
        final_price = ai_price * seasonal_multiplier * demand_multiplier
        final_price = max(base_price * 0.7, min(base_price * 2.2, final_price))
        
        return jsonify({
            "status": "success",
            "data": {
                "base_price": base_price,
                "ai_suggested_price": round(ai_price, 2),
                "final_price": round(final_price, 2),
                "price_per_person": round(final_price / guests, 2),
                "pricing_insights": {
                    "purchase_probability": round(purchase_prob, 3),
                    "seasonal_multiplier": round(seasonal_multiplier, 3),
                    "demand_multiplier": round(demand_multiplier, 3),
                    "ai_confidence": round(purchase_prob, 3),
                    "personalized": user_id is not None
                },
                "savings": round(max(0, base_price - final_price), 2),
                "premium": round(max(0, final_price - base_price), 2)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting AI pricing: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# SEED DATA WITH SRI LANKAN DESTINATIONS
@app.route('/api/seed', methods=['GET'])
def seed_data():
    cur = None
    try:
        cur = get_db_cursor()
        cur.execute("SELECT COUNT(*) AS count FROM tours")
        result = cur.fetchone()
        tour_count = result['count'] if result else 0
        
        if tour_count > 0:
            logger.info(f"Skipping seed: {tour_count} tours already exist")
            return jsonify({
                "status": "success",
                "message": f"Database already contains {tour_count} tours. Use /api/seed-sri-lanka to replace with Sri Lankan destinations."
            })
        
        # 12 Authentic Sri Lankan Destinations
        cur.execute("""
            INSERT INTO tours (name, description, price, duration_days, tour_type, image_url)
            VALUES 
                ('Pristine Beaches of Mirissa', 'Experience whale watching and pristine beaches in southern Sri Lanka with beachfront villa stay', 850.00, 5, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Misty Mountains of Ella', 'Discover tea plantations, Nine Arch Bridge, and Little Adams Peak in the hill country', 650.00, 6, 'Hill Country', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'),
                ('Cultural Triangle Explorer', 'Explore ancient cities of Sigiriya Rock Fortress, Anuradhapura, and Polonnaruwa', 1200.00, 8, 'Cultural', 'https://images.unsplash.com/photo-1539650116574-75c0c6d0ec5c'),
                ('Sacred City of Kandy', 'Visit Temple of the Tooth Relic, Royal Botanical Gardens, and cultural performances', 520.00, 4, 'Cultural', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Wildlife Safari Adventure', 'Leopard spotting in Yala National Park with luxury safari camping', 800.00, 5, 'Wildlife', 'https://images.unsplash.com/photo-1549366021-9f761d040a94'),
                ('Tea Country Experience', 'Explore Nuwara Eliya tea plantations, Horton Plains, and cool mountain climate', 550.00, 4, 'Hill Country', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Golden Beaches of Arugam Bay', 'World-class surfing destination with beach bungalow accommodation', 680.00, 6, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Ancient Fortress of Jaffna', 'Explore rich Tamil culture, Jaffna Fort, and Nallur Temple heritage', 600.00, 5, 'Cultural', 'https://images.unsplash.com/photo-1539650116574-75c0c6d0ec5c'),
                ('Pristine Trincomalee', 'Beautiful Nilaveli Beach and ancient Koneswaram Temple with whale watching', 720.00, 6, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Galle Dutch Fort Heritage', 'UNESCO World Heritage colonial fort with cobblestone streets', 480.00, 3, 'Heritage', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Tropical Paradise Unawatuna', 'Palm-fringed beaches, coral reef snorkeling, and sunset cruises', 750.00, 7, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Sinharaja Rainforest Trek', 'UNESCO Biosphere Reserve trekking with endemic wildlife', 580.00, 4, 'Nature', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e')
        """)
        
        # Add enhanced admin user
        hashed_password = generate_password_hash('admin123')
        cur.execute("""
            INSERT INTO users (username, email, password, role, age, city_tier, monthly_income, owns_car, has_passport, number_of_trips)
            VALUES ('admin', 'admin@srilanka-tours.com', %s, 'admin', 30, 1, 75000, TRUE, TRUE, 5)
        """, (hashed_password,))
        
        # Add sample bookings for Sri Lankan tours
        cur.execute("""
            INSERT INTO bookings (user_id, tour_id, travel_date, guests, total_price, customer_name, customer_email, customer_phone, status, package_type, number_of_children)
            VALUES 
                (1, 1, '2025-12-15', 2, 1700.00, 'Admin User', 'admin@srilanka-tours.com', '+94-123-456-7890', 'confirmed', 'standard', 0),
                (1, 3, '2025-01-20', 4, 4800.00, 'Admin User', 'admin@srilanka-tours.com', '+94-123-456-7890', 'confirmed', 'premium', 2),
                (1, 5, '2025-02-10', 2, 1600.00, 'Admin User', 'admin@srilanka-tours.com', '+94-123-456-7890', 'confirmed', 'standard', 0)
        """)
        
        mysql.connection.commit()
        logger.info("Sri Lankan seed data added successfully!")
        return jsonify({
            "status": "success",
            "message": "Sri Lankan tour data seeded successfully - 12 authentic destinations added"
        })
        
    except Exception as e:
        logger.error(f"Error during seeding: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# SRI LANKAN DESTINATIONS ONLY SEED
@app.route('/api/seed-sri-lanka', methods=['GET'])
def seed_sri_lankan_data():
    cur = None
    try:
        cur = get_db_cursor()
        
        # Clear existing tours
        cur.execute("DELETE FROM tours")
        logger.info("Cleared existing tours")
        
        # Insert 12 Sri Lankan destinations using existing table structure
        cur.execute("""
            INSERT INTO tours (name, description, price, duration_days, tour_type, image_url)
            VALUES 
                ('Pristine Beaches of Mirissa', 'Experience whale watching and pristine beaches in southern Sri Lanka with beachfront villa stay and stilt fishing experiences', 850.00, 5, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Misty Mountains of Ella', 'Discover tea plantations, Nine Arch Bridge, Little Adams Peak, and traditional tea factory tours in the hill country', 650.00, 6, 'Hill Country', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'),
                ('Cultural Triangle Explorer', 'Explore ancient cities of Sigiriya Rock Fortress, Anuradhapura sacred city, and Polonnaruwa medieval capital', 1200.00, 8, 'Cultural', 'https://images.unsplash.com/photo-1539650116574-75c0c6d0ec5c'),
                ('Sacred City of Kandy', 'Visit Temple of the Tooth Relic, Royal Botanical Gardens, traditional Kandyan dance, and Lake Kandy boat rides', 520.00, 4, 'Cultural', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Wildlife Safari Adventure', 'Leopard spotting in Yala National Park with luxury safari camping, elephant orphanage, and bird watching tours', 800.00, 5, 'Wildlife', 'https://images.unsplash.com/photo-1549366021-9f761d040a94'),
                ('Tea Country Experience', 'Explore Nuwara Eliya tea plantations, Horton Plains World''s End, cool mountain climate, and colonial heritage hotels', 550.00, 4, 'Hill Country', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Golden Beaches of Arugam Bay', 'World-class surfing destination with beach bungalow accommodation, Kumana Bird Sanctuary, and fresh seafood dining', 680.00, 6, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Ancient Fortress of Jaffna', 'Explore rich Tamil culture, historic Jaffna Fort, Nallur Temple heritage, and island hopping tours', 600.00, 5, 'Cultural', 'https://images.unsplash.com/photo-1539650116574-75c0c6d0ec5c'),
                ('Pristine Trincomalee', 'Beautiful Nilaveli Beach, ancient Koneswaram Temple, whale watching cruises, and hot springs experience', 720.00, 6, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Galle Dutch Fort Heritage', 'UNESCO World Heritage colonial fort with cobblestone streets, rampart walks, and ocean views', 480.00, 3, 'Heritage', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96'),
                ('Tropical Paradise Unawatuna', 'Palm-fringed beaches, coral reef snorkeling, sunset catamaran cruises, and beachfront relaxation', 750.00, 7, 'Beach', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'),
                ('Sinharaja Rainforest Trek', 'UNESCO Biosphere Reserve trekking with endemic wildlife, bird watching, and nature conservation experiences', 580.00, 4, 'Nature', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e')
        """)
        
        mysql.connection.commit()
        
        # Verify insertion
        cur.execute("SELECT COUNT(*) as count FROM tours")
        count_result = cur.fetchone()
        count = count_result['count'] if count_result else 0
        
        cur.execute("SELECT name, tour_type FROM tours ORDER BY id LIMIT 5")
        sample_tours = cur.fetchall()
        
        logger.info(f"Successfully inserted {count} Sri Lankan tours")
        
        return jsonify({
            "status": "success",
            "message": f"Sri Lankan destinations seeded successfully! Added {count} authentic Sri Lankan tours.",
            "tours_added": count,
            "sample_tours": [{"name": tour['name'], "type": tour['tour_type']} for tour in sample_tours],
            "note": "Database now contains only Sri Lankan destinations"
        })
        
    except Exception as e:
        logger.error(f"Error seeding Sri Lankan data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to seed Sri Lankan data: {str(e)}"
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# DEBUG ENDPOINT
@app.route('/api/debug-table-structure', methods=['GET'])
def debug_table_structure():
    cur = None
    try:
        cur = get_db_cursor()
        cur.execute("DESCRIBE tours")
        columns = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) as count FROM tours")
        count_result = cur.fetchone()
        tour_count = count_result['count'] if count_result else 0
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

@app.route('/api/test-db', methods=['GET'])
def test_db_connection():
    cur = None
    try:
        cur = get_db_cursor()
        cur.execute("SELECT 1 as test")
        result = cur.fetchone()
        return jsonify({
            "status": "success",
            "message": "Database connection successful",
            "data": result
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

# Updated /api/auth/register endpoint (replacing the original)
@app.route('/api/auth/register', methods=['POST'])
def register():
    cur = None
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return jsonify({
                "status": "error",
                "message": "Invalid email format"
            }), 400
        
        if len(data['password']) < 6:
            return jsonify({
                "status": "error",
                "message": "Password must be at least 6 characters long"
            }), 400
        
        cur = get_db_cursor()
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", 
                   (data['email'], data['username']))
        if cur.fetchone():
            return jsonify({
                "status": "error",
                "message": "User already exists"
            }), 409
        
        hashed_password = generate_password_hash(data['password'])
        
        # First, check if all the optional columns exist in the database
        cur.execute("DESCRIBE users")
        columns = cur.fetchall()
        column_names = [col['Field'] for col in columns]
        
        # Build the insert query dynamically based on existing columns
        base_fields = ['username', 'email', 'password']
        base_values = [data['username'], data['email'], hashed_password]
        
        optional_fields = {
            'age': data.get('age'),
            'city_tier': data.get('city_tier', 2),
            'monthly_income': data.get('monthly_income'),
            'occupation': data.get('occupation'),
            'gender': data.get('gender'),
            'owns_car': data.get('owns_car', False),
            'has_passport': data.get('has_passport', False),
            'number_of_trips': 0
        }
        
        # Only include fields that exist in the database and have values
        for field, value in optional_fields.items():
            if field in column_names and value is not None:
                base_fields.append(field)
                base_values.append(value)
        
        # Build the SQL query
        placeholders = ', '.join(['%s'] * len(base_fields))
        fields_str = ', '.join(base_fields)
        
        sql = f"INSERT INTO users ({fields_str}) VALUES ({placeholders})"
        
        cur.execute(sql, base_values)
        mysql.connection.commit()
        
        cur.execute("SELECT id, username, email, role FROM users WHERE email = %s", (data['email'],))
        user = cur.fetchone()
        
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "status": "success",
            "message": "User registered successfully",
            "data": {
                "user": user,
                "token": token
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

@app.route('/api/auth/login', methods=['POST'])
def login():
    cur = None
    try:
        data = request.get_json()
        
        if 'email' not in data or 'password' not in data:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400
        
        cur = get_db_cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cur.fetchone()
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401
        
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        user_data = {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
        
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "data": {
                "user": user_data,
                "token": token
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

@app.route('/api/tours', methods=['GET'])
def get_tours():
    cur = None
    try:
        cur = get_db_cursor()
        cur.execute("SELECT * FROM tours ORDER BY name")
        tours = cur.fetchall()
        
        # Enhance tours with location data for frontend compatibility
        enhanced_tours = []
        for tour in tours:
            tour_dict = dict(tour)
            # Add location based on tour name for frontend filtering
            if 'mirissa' in tour_dict['name'].lower():
                tour_dict['location'] = 'Mirissa, Southern Province'
                tour_dict['region'] = 'coastal'
            elif 'ella' in tour_dict['name'].lower():
                tour_dict['location'] = 'Ella, Uva Province'
                tour_dict['region'] = 'hill country'
            elif 'kandy' in tour_dict['name'].lower():
                tour_dict['location'] = 'Kandy, Central Province'
                tour_dict['region'] = 'cultural'
            elif 'yala' in tour_dict['name'].lower() or 'wildlife' in tour_dict['name'].lower():
                tour_dict['location'] = 'Yala National Park'
                tour_dict['region'] = 'wilderness'
            elif 'cultural triangle' in tour_dict['name'].lower():
                tour_dict['location'] = 'Cultural Triangle'
                tour_dict['region'] = 'cultural'
            elif 'nuwara eliya' in tour_dict['name'].lower() or 'tea country' in tour_dict['name'].lower():
                tour_dict['location'] = 'Nuwara Eliya, Central Province'
                tour_dict['region'] = 'hill country'
            elif 'arugam' in tour_dict['name'].lower():
                tour_dict['location'] = 'Arugam Bay, Eastern Province'
                tour_dict['region'] = 'coastal'
            elif 'jaffna' in tour_dict['name'].lower():
                tour_dict['location'] = 'Jaffna, Northern Province'
                tour_dict['region'] = 'cultural'
            elif 'trincomalee' in tour_dict['name'].lower():
                tour_dict['location'] = 'Trincomalee, Eastern Province'
                tour_dict['region'] = 'coastal'
            elif 'galle' in tour_dict['name'].lower():
                tour_dict['location'] = 'Galle, Southern Province'
                tour_dict['region'] = 'cultural'
            elif 'unawatuna' in tour_dict['name'].lower():
                tour_dict['location'] = 'Unawatuna, Southern Province'
                tour_dict['region'] = 'coastal'
            elif 'sinharaja' in tour_dict['name'].lower():
                tour_dict['location'] = 'Sinharaja, Sabaragamuwa Province'
                tour_dict['region'] = 'wilderness'
            else:
                tour_dict['location'] = 'Sri Lanka'
                tour_dict['region'] = 'cultural'
            
            enhanced_tours.append(tour_dict)
        
        return jsonify({
            "status": "success",
            "data": enhanced_tours,
            "count": len(enhanced_tours)
        })
    except Exception as e:
        logger.error(f"Error fetching tours: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cur:
            close_db_cursor(cur)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        response = chatbot.get_response(user_message)
        
        return jsonify({
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return jsonify({
        "status": "success",
        "message": "Sri Lanka AI-Powered Tour System API",
        "country": "Sri Lanka - Pearl of the Indian Ocean",
        "ai_features": {
            "models_loaded": ai_models.is_loaded,
            "ready_for_ai": ai_models.is_loaded
        },
        "endpoints": {
            "health": "/api/health",
            "ai_powered": {
                "ai_status": "/api/ai-status",
                "train_models": "/api/train-models", 
                "ai_recommendations": "/api/ai-recommendations",
                "ai_pricing": "/api/ai-pricing"
            },
            "auth": {
                "register": "/api/auth/register",
                "login": "/api/auth/login"
            },
            "core": {
                "tours": "/api/tours",
                "bookings": "/api/bookings (GET/POST)",
                "tour_details": "/api/tours/<id>"
            },
            "utilities": {
                "seed": "/api/seed",
                "seed_sri_lanka": "/api/seed-sri-lanka",
                "debug_table": "/api/debug-table-structure",
                "test_db": "/api/test-db",
                "chat": "/api/chat"
            }
        },
        "sri_lankan_destinations": [
            "Mirissa Beach", "Ella Mountains", "Cultural Triangle", 
            "Kandy", "Yala National Park", "Nuwara Eliya",
            "Arugam Bay", "Jaffna", "Trincomalee", 
            "Galle Fort", "Unawatuna", "Sinharaja Rainforest"
        ],
        "instructions": {
            "step1": "Visit /api/seed-sri-lanka to load Sri Lankan destinations",
            "step2": "Check /api/tours to verify Sri Lankan tours are loaded", 
            "step3": "Visit your frontend packages page to see Sri Lankan destinations",
            "step4": "Use /api/train-models for AI features (optional)",
            "step5": "Test booking with /api/bookings endpoint"
        }
    })

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

if __name__ == '__main__':
    logger.info("🚀 Starting Sri Lanka AI-powered tour system...")
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])