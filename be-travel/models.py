import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os
import json
import random
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

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