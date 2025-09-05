# tour_package_ml_models.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from sklearn.neighbors import NearestNeighbors
import joblib
import logging
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class TourPackageRecommendationEngine:
    def __init__(self):
        self.recommendation_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.similarity_model = NearestNeighbors(n_neighbors=10, metric='cosine')
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        self.feature_columns = []
        self.customer_profiles = None
        
    def load_tour_package_data(self, csv_path):
        """Load and preprocess tour package dataset"""
        try:
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded tour package dataset: {len(df)} rows, {len(df.columns)} columns")
            
            # Basic data cleaning
            df = df.dropna(subset=['CustomerID', 'ProdTaken'])
            
            # Convert categorical variables
            categorical_columns = ['TypeofContact', 'Occupation', 'Gender', 
                                 'ProductPitched', 'MaritalStatus', 'Designation']
            
            for col in categorical_columns:
                if col in df.columns:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].fillna('Unknown'))
            
            # Feature engineering
            df['Age_Group'] = pd.cut(df['Age'], bins=[0, 30, 45, 60, 100], 
                                   labels=['Young', 'Middle', 'Senior', 'Elder'])
            df['Age_Group_encoded'] = LabelEncoder().fit_transform(df['Age_Group'])
            
            df['Income_Group'] = pd.cut(df['MonthlyIncome'], 
                                      bins=[0, 20000, 50000, 100000, float('inf')],
                                      labels=['Low', 'Medium', 'High', 'Premium'])
            df['Income_Group_encoded'] = LabelEncoder().fit_transform(df['Income_Group'].fillna('Low'))
            
            # Family size calculation
            df['Family_Size'] = df['NumberOfPersonVisiting'] + df['NumberOfChildrenVisiting'].fillna(0)
            
            # Travel frequency
            df['Travel_Frequency'] = pd.cut(df['NumberOfTrips'].fillna(0), 
                                          bins=[-1, 0, 2, 5, float('inf')],
                                          labels=['None', 'Occasional', 'Regular', 'Frequent'])
            df['Travel_Frequency_encoded'] = LabelEncoder().fit_transform(df['Travel_Frequency'])
            
            # Satisfaction level
            df['High_Satisfaction'] = (df['PitchSatisfactionScore'] >= 4).astype(int)
            
            self.tour_data = df
            logger.info("Tour package data preprocessed successfully")
            return df
            
        except Exception as e:
            logger.error(f"Error loading tour package data: {str(e)}")
            return None
    
    def prepare_features(self, df):
        """Prepare features for machine learning"""
        try:
            # Select relevant features
            feature_columns = [
                'Age', 'CityTier', 'DurationOfPitch', 'NumberOfPersonVisiting',
                'NumberOfFollowups', 'PreferredPropertyStar', 'PitchSatisfactionScore',
                'OwnCar', 'NumberOfChildrenVisiting', 'MonthlyIncome', 'Passport',
                'Family_Size'
            ]
            
            # Add encoded categorical features
            encoded_columns = [col for col in df.columns if col.endswith('_encoded')]
            feature_columns.extend(encoded_columns)
            
            # Filter existing columns
            available_features = [col for col in feature_columns if col in df.columns]
            
            X = df[available_features].fillna(0)
            y = df['ProdTaken']
            
            self.feature_columns = available_features
            return X, y
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            return None, None
    
    def train_recommendation_model(self):
        """Train the recommendation model"""
        try:
            if self.tour_data is None:
                logger.error("No tour data loaded")
                return False
            
            X, y = self.prepare_features(self.tour_data)
            if X is None:
                return False
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # Train recommendation model
            self.recommendation_model.fit(X_train, y_train)
            
            # Train similarity model for customer clustering
            self.similarity_model.fit(X_scaled)
            
            # Evaluate
            y_pred = self.recommendation_model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            logger.info(f"Recommendation model trained with accuracy: {accuracy:.3f}")
            
            # Store customer profiles
            self.customer_profiles = X_scaled
            self.is_trained = True
            
            return True
            
        except Exception as e:
            logger.error(f"Error training recommendation model: {str(e)}")
            return False
    
    def get_customer_recommendations(self, customer_features):
        """Get recommendations for a customer based on their features"""
        try:
            if not self.is_trained:
                logger.warning("Model not trained")
                return []
            
            # Convert customer features to the expected format
            feature_vector = np.zeros(len(self.feature_columns))
            
            # Map customer features to our feature columns
            feature_mapping = {
                'age': 'Age',
                'city_tier': 'CityTier', 
                'guests': 'NumberOfPersonVisiting',
                'children': 'NumberOfChildrenVisiting',
                'income': 'MonthlyIncome',
                'owns_car': 'OwnCar',
                'has_passport': 'Passport'
            }
            
            for customer_key, model_key in feature_mapping.items():
                if customer_key in customer_features and model_key in self.feature_columns:
                    idx = self.feature_columns.index(model_key)
                    feature_vector[idx] = customer_features[customer_key]
            
            # Scale the features
            feature_vector_scaled = self.scaler.transform([feature_vector])
            
            # Get purchase probability
            purchase_probability = self.recommendation_model.predict_proba(feature_vector_scaled)[0][1]
            
            # Find similar customers
            distances, indices = self.similarity_model.kneighbors(feature_vector_scaled)
            
            # Get recommendations based on similar customers
            similar_customers = indices[0]
            similar_customer_data = self.tour_data.iloc[similar_customers]
            
            # Analyze popular products among similar customers
            product_recommendations = similar_customer_data[
                similar_customer_data['ProdTaken'] == 1
            ]['ProductPitched'].value_counts().head(5)
            
            recommendations = {
                'purchase_probability': purchase_probability,
                'recommended_products': product_recommendations.to_dict(),
                'similar_customers_count': len(similar_customers),
                'confidence_score': 1 - np.mean(distances[0])
            }
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting customer recommendations: {str(e)}")
            return {}
    
    def predict_tour_preference(self, user_profile):
        """Predict which tour types a user might prefer"""
        try:
            recommendations = self.get_customer_recommendations(user_profile)
            
            if not recommendations:
                return []
            
            # Map product types to tour categories
            product_mapping = {
                'Basic': ['budget', 'simple', 'standard'],
                'Standard': ['popular', 'family', 'group'],
                'Deluxe': ['premium', 'luxury', 'deluxe'],
                'Super Deluxe': ['luxury', 'premium', 'exclusive'],
                'King': ['exclusive', 'royal', 'ultimate']
            }
            
            preferred_tours = []
            for product, count in recommendations['recommended_products'].items():
                if product in product_mapping:
                    for tour_type in product_mapping[product]:
                        preferred_tours.append({
                            'tour_type': tour_type,
                            'preference_score': count / sum(recommendations['recommended_products'].values()),
                            'confidence': recommendations['confidence_score']
                        })
            
            return sorted(preferred_tours, key=lambda x: x['preference_score'], reverse=True)
            
        except Exception as e:
            logger.error(f"Error predicting tour preference: {str(e)}")
            return []

class TourPackagePricingOptimizer:
    def __init__(self):
        self.pricing_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.demand_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = []
        
    def load_pricing_data(self, tour_package_df):
        """Prepare pricing data from tour package dataset"""
        try:
            # Create price categories based on product types
            price_mapping = {
                'Basic': 500,
                'Standard': 1000,
                'Deluxe': 2000,
                'Super Deluxe': 3500,
                'King': 5000
            }
            
            df = tour_package_df.copy()
            df['Estimated_Price'] = df['ProductPitched'].map(price_mapping).fillna(1000)
            
            # Adjust price based on customer characteristics
            df['Price_Adjustment'] = 1.0
            
            # Higher income customers can afford higher prices
            df.loc[df['MonthlyIncome'] > 50000, 'Price_Adjustment'] *= 1.2
            df.loc[df['MonthlyIncome'] > 100000, 'Price_Adjustment'] *= 1.4
            
            # City tier affects pricing
            df.loc[df['CityTier'] == 1, 'Price_Adjustment'] *= 1.3  # Tier 1 cities
            df.loc[df['CityTier'] == 2, 'Price_Adjustment'] *= 1.1  # Tier 2 cities
            
            # Group size affects pricing
            df['Price_Per_Person'] = (df['Estimated_Price'] * df['Price_Adjustment']) / df['NumberOfPersonVisiting']
            
            # Family discount
            df.loc[df['NumberOfChildrenVisiting'] > 0, 'Price_Per_Person'] *= 0.9
            
            # Satisfaction-based premium
            df.loc[df['PitchSatisfactionScore'] >= 4, 'Price_Per_Person'] *= 1.1
            
            self.pricing_data = df
            logger.info("Pricing data prepared successfully")
            return df
            
        except Exception as e:
            logger.error(f"Error preparing pricing data: {str(e)}")
            return None
    
    def train_pricing_model(self, tour_package_df):
        """Train pricing optimization model"""
        try:
            pricing_df = self.load_pricing_data(tour_package_df)
            if pricing_df is None:
                return False
            
            # Prepare features for pricing
            feature_columns = [
                'Age', 'CityTier', 'NumberOfPersonVisiting', 'NumberOfChildrenVisiting',
                'MonthlyIncome', 'PreferredPropertyStar', 'NumberOfTrips', 'PitchSatisfactionScore'
            ]
            
            # Add encoded features
            encoded_columns = [col for col in pricing_df.columns if col.endswith('_encoded')]
            feature_columns.extend(encoded_columns)
            
            # Filter available columns
            available_features = [col for col in feature_columns if col in pricing_df.columns]
            
            X = pricing_df[available_features].fillna(0)
            y_price = pricing_df['Price_Per_Person']
            y_demand = pricing_df['ProdTaken']
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train pricing model
            X_train, X_test, y_price_train, y_price_test = train_test_split(
                X_scaled, y_price, test_size=0.2, random_state=42
            )
            
            self.pricing_model.fit(X_train, y_price_train)
            
            # Train demand model
            X_train_d, X_test_d, y_demand_train, y_demand_test = train_test_split(
                X_scaled, y_demand, test_size=0.2, random_state=42
            )
            
            self.demand_model.fit(X_train_d, y_demand_train)
            
            # Evaluate models
            price_score = self.pricing_model.score(X_test, y_price_test)
            demand_score = self.demand_model.score(X_test_d, y_demand_test)
            
            logger.info(f"Pricing model R² score: {price_score:.3f}")
            logger.info(f"Demand model accuracy: {demand_score:.3f}")
            
            self.feature_columns = available_features
            self.is_trained = True
            
            return True
            
        except Exception as e:
            logger.error(f"Error training pricing model: {str(e)}")
            return False
    
    def predict_optimal_price(self, customer_profile, base_price, tour_type='Standard'):
        """Predict optimal price for a customer"""
        try:
            if not self.is_trained:
                return base_price
            
            # Prepare customer features
            feature_vector = np.zeros(len(self.feature_columns))
            
            # Map customer profile to feature columns
            profile_mapping = {
                'age': 'Age',
                'city_tier': 'CityTier',
                'guests': 'NumberOfPersonVisiting', 
                'children': 'NumberOfChildrenVisiting',
                'income': 'MonthlyIncome',
                'preferred_star': 'PreferredPropertyStar',
                'trips': 'NumberOfTrips',
                'satisfaction': 'PitchSatisfactionScore'
            }
            
            for profile_key, feature_key in profile_mapping.items():
                if profile_key in customer_profile and feature_key in self.feature_columns:
                    idx = self.feature_columns.index(feature_key)
                    feature_vector[idx] = customer_profile[profile_key]
            
            # Scale features
            feature_vector_scaled = self.scaler.transform([feature_vector])
            
            # Predict price and demand
            predicted_price = self.pricing_model.predict(feature_vector_scaled)[0]
            demand_probability = self.demand_model.predict_proba(feature_vector_scaled)[0][1]
            
            # Adjust price based on demand probability
            if demand_probability > 0.7:
                price_multiplier = 1.2  # High demand, increase price
            elif demand_probability < 0.3:
                price_multiplier = 0.8  # Low demand, decrease price
            else:
                price_multiplier = 1.0
            
            optimal_price = predicted_price * price_multiplier
            
            # Ensure reasonable bounds
            min_price = base_price * 0.5
            max_price = base_price * 2.5
            
            final_price = max(min_price, min(max_price, optimal_price))
            
            return {
                'optimal_price': final_price,
                'demand_probability': demand_probability,
                'price_multiplier': price_multiplier,
                'base_prediction': predicted_price
            }
            
        except Exception as e:
            logger.error(f"Error predicting optimal price: {str(e)}")
            return {'optimal_price': base_price, 'demand_probability': 0.5}

class CustomerSegmentationEngine:
    def __init__(self):
        self.segmentation_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def create_customer_segments(self, tour_package_df):
        """Create customer segments based on tour package data"""
        try:
            from sklearn.cluster import KMeans
            
            # Prepare features for segmentation
            features = ['Age', 'MonthlyIncome', 'NumberOfPersonVisiting', 
                       'NumberOfTrips', 'PitchSatisfactionScore', 'CityTier']
            
            X = tour_package_df[features].fillna(tour_package_df[features].median())
            X_scaled = self.scaler.fit_transform(X)
            
            # Determine optimal number of clusters
            optimal_clusters = 5
            
            # Create segments
            self.segmentation_model = KMeans(n_clusters=optimal_clusters, random_state=42)
            segments = self.segmentation_model.fit_predict(X_scaled)
            
            # Add segments to dataframe
            df_with_segments = tour_package_df.copy()
            df_with_segments['Customer_Segment'] = segments
            
            # Analyze segments
            segment_analysis = {}
            for segment in range(optimal_clusters):
                segment_data = df_with_segments[df_with_segments['Customer_Segment'] == segment]
                
                segment_analysis[f'Segment_{segment}'] = {
                    'size': len(segment_data),
                    'avg_age': segment_data['Age'].mean(),
                    'avg_income': segment_data['MonthlyIncome'].mean(),
                    'avg_satisfaction': segment_data['PitchSatisfactionScore'].mean(),
                    'conversion_rate': segment_data['ProdTaken'].mean(),
                    'popular_products': segment_data['ProductPitched'].value_counts().head(3).to_dict()
                }
            
            self.segment_data = df_with_segments
            self.segment_analysis = segment_analysis
            self.is_trained = True
            
            logger.info(f"Customer segmentation completed: {optimal_clusters} segments created")
            return segment_analysis
            
        except Exception as e:
            logger.error(f"Error creating customer segments: {str(e)}")
            return {}
    
    def predict_customer_segment(self, customer_profile):
        """Predict which segment a customer belongs to"""
        try:
            if not self.is_trained:
                return None
            
            # Prepare customer features
            features = ['age', 'income', 'guests', 'trips', 'satisfaction', 'city_tier']
            feature_vector = []
            
            feature_defaults = {
                'age': 35, 'income': 50000, 'guests': 2, 
                'trips': 1, 'satisfaction': 3, 'city_tier': 2
            }
            
            for feature in features:
                value = customer_profile.get(feature, feature_defaults[feature])
                feature_vector.append(value)
            
            # Scale and predict
            feature_vector_scaled = self.scaler.transform([feature_vector])
            segment = self.segmentation_model.predict(feature_vector_scaled)[0]
            
            return {
                'segment': f'Segment_{segment}',
                'segment_characteristics': self.segment_analysis.get(f'Segment_{segment}', {})
            }
            
        except Exception as e:
            logger.error(f"Error predicting customer segment: {str(e)}")
            return None

# Utility functions
def save_tour_package_models(recommender, pricing_optimizer, segmentation_engine):
    """Save all tour package models"""
    try:
        import os
        os.makedirs('models', exist_ok=True)
        
        joblib.dump(recommender, 'models/tour_package_recommender.pkl')
        joblib.dump(pricing_optimizer, 'models/tour_package_pricing.pkl')
        joblib.dump(segmentation_engine, 'models/customer_segmentation.pkl')
        
        logger.info("Tour package models saved successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error saving models: {str(e)}")
        return False

def load_tour_package_models():
    """Load tour package models"""
    try:
        recommender = joblib.load('models/tour_package_recommender.pkl')
        pricing_optimizer = joblib.load('models/tour_package_pricing.pkl')
        segmentation_engine = joblib.load('models/customer_segmentation.pkl')
        
        logger.info("Tour package models loaded successfully")
        return recommender, pricing_optimizer, segmentation_engine
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        return None, None, None

def integrate_tour_package_dataset(csv_path):
    """Main integration function"""
    try:
        # Initialize engines
        recommender = TourPackageRecommendationEngine()
        pricing_optimizer = TourPackagePricingOptimizer()
        segmentation_engine = CustomerSegmentationEngine()
        
        # Load and process data
        tour_data = recommender.load_tour_package_data(csv_path)
        if tour_data is None:
            return None, None, None
        
        # Train models
        if recommender.train_recommendation_model():
            logger.info("Recommendation engine trained successfully")
        
        if pricing_optimizer.train_pricing_model(tour_data):
            logger.info("Pricing optimizer trained successfully")
        
        segmentation_results = segmentation_engine.create_customer_segments(tour_data)
        if segmentation_results:
            logger.info("Customer segmentation completed successfully")
        
        return recommender, pricing_optimizer, segmentation_engine
        
    except Exception as e:
        logger.error(f"Error integrating tour package dataset: {str(e)}")
        return None, None, None