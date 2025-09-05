# train_with_epochs.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
from sklearn.cluster import KMeans
import joblib
import logging
import os
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EpochBasedTrainer:
    def __init__(self, csv_path, epochs=10):
        self.csv_path = csv_path
        self.epochs = epochs
        self.raw_data = None
        self.processed_data = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
        # Models
        self.recommendation_model = None
        self.pricing_model = None
        self.segmentation_model = None
        
        # Training history
        self.training_history = {
            'recommendation_accuracy': [],
            'pricing_r2': [],
            'epoch_times': [],
            'best_epoch': 0,
            'best_accuracy': 0
        }
        
    def load_and_preprocess_data(self):
        """Load and preprocess the dataset"""
        try:
            logger.info("Loading dataset...")
            self.raw_data = pd.read_csv(self.csv_path)
            
            logger.info(f"Dataset shape: {self.raw_data.shape}")
            logger.info(f"Conversion rate: {self.raw_data['ProdTaken'].mean():.2%}")
            
            # Preprocessing
            self.processed_data = self.raw_data.copy()
            
            # Handle missing values
            self.processed_data = self.processed_data.dropna(subset=['CustomerID', 'ProdTaken'])
            
            # Encode categorical variables
            categorical_columns = ['TypeofContact', 'Occupation', 'Gender', 
                                 'ProductPitched', 'MaritalStatus', 'Designation']
            
            for col in categorical_columns:
                if col in self.processed_data.columns:
                    self.label_encoders[col] = LabelEncoder()
                    self.processed_data[f'{col}_encoded'] = self.label_encoders[col].fit_transform(
                        self.processed_data[col].fillna('Unknown')
                    )
            
            # Feature engineering
            self.processed_data['Age_Group'] = pd.cut(
                self.processed_data['Age'], 
                bins=[0, 30, 45, 60, 100], 
                labels=['Young', 'Middle', 'Senior', 'Elder']
            )
            self.processed_data['Age_Group_encoded'] = LabelEncoder().fit_transform(
                self.processed_data['Age_Group'].fillna('Middle')
            )
            
            self.processed_data['Income_Group'] = pd.cut(
                self.processed_data['MonthlyIncome'], 
                bins=[0, 20000, 50000, 100000, float('inf')],
                labels=['Low', 'Medium', 'High', 'Premium']
            )
            self.processed_data['Income_Group_encoded'] = LabelEncoder().fit_transform(
                self.processed_data['Income_Group'].fillna('Low')
            )
            
            self.processed_data['Family_Size'] = (
                self.processed_data['NumberOfPersonVisiting'] + 
                self.processed_data['NumberOfChildrenVisiting'].fillna(0)
            )
            
            # Fill missing numeric values
            numeric_columns = ['Age', 'DurationOfPitch', 'NumberOfFollowups', 
                             'PreferredPropertyStar', 'NumberOfTrips', 'MonthlyIncome']
            
            for col in numeric_columns:
                if col in self.processed_data.columns:
                    median_val = self.processed_data[col].median()
                    self.processed_data[col] = self.processed_data[col].fillna(median_val)
            
            logger.info("Data preprocessing completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error in data preprocessing: {str(e)}")
            return False
    
    def prepare_features(self):
        """Prepare features for training"""
        try:
            # Features for recommendation model
            self.recommendation_features = [
                'Age', 'CityTier', 'DurationOfPitch', 'NumberOfPersonVisiting',
                'NumberOfFollowups', 'PreferredPropertyStar', 'PitchSatisfactionScore',
                'OwnCar', 'NumberOfChildrenVisiting', 'MonthlyIncome', 'Passport',
                'Family_Size', 'NumberOfTrips'
            ]
            
            # Add encoded categorical features
            encoded_features = [col for col in self.processed_data.columns if col.endswith('_encoded')]
            self.recommendation_features.extend(encoded_features)
            
            # Filter features that exist in dataset
            self.recommendation_features = [
                col for col in self.recommendation_features 
                if col in self.processed_data.columns
            ]
            
            # Prepare feature matrix and target
            self.X = self.processed_data[self.recommendation_features].fillna(0)
            self.y_purchase = self.processed_data['ProdTaken']
            
            logger.info(f"Feature matrix shape: {self.X.shape}")
            logger.info(f"Features selected: {len(self.recommendation_features)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            return False
    
    def train_with_epochs(self):
        """Train models with epoch-based approach"""
        try:
            logger.info(f"Starting epoch-based training for {self.epochs} epochs...")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(self.X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, self.y_purchase, test_size=0.2, random_state=42, stratify=self.y_purchase
            )
            
            best_accuracy = 0
            best_model = None
            
            for epoch in range(self.epochs):
                epoch_start = datetime.now()
                logger.info(f"\n--- EPOCH {epoch + 1}/{self.epochs} ---")
                
                # Train recommendation model with different random states for variation
                model = RandomForestClassifier(
                    n_estimators=100 + (epoch * 10),  # Increase trees each epoch
                    random_state=42 + epoch,  # Different random state each epoch
                    class_weight='balanced',
                    max_depth=10 + epoch,  # Gradually increase complexity
                    min_samples_split=2 + (epoch % 3)
                )
                
                model.fit(X_train, y_train)
                
                # Evaluate
                y_pred = model.predict(X_test)
                accuracy = accuracy_score(y_test, y_pred)
                
                # Cross-validation
                cv_scores = cross_val_score(model, X_scaled, self.y_purchase, cv=5)
                cv_mean = cv_scores.mean()
                
                # Store training history
                self.training_history['recommendation_accuracy'].append(accuracy)
                epoch_time = (datetime.now() - epoch_start).total_seconds()
                self.training_history['epoch_times'].append(epoch_time)
                
                logger.info(f"Accuracy: {accuracy:.4f}")
                logger.info(f"CV Score: {cv_mean:.4f} ± {cv_scores.std():.4f}")
                logger.info(f"Epoch time: {epoch_time:.2f}s")
                
                # Keep best model
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_model = model
                    self.training_history['best_epoch'] = epoch + 1
                    self.training_history['best_accuracy'] = best_accuracy
                    logger.info(f"🏆 New best model! Accuracy: {best_accuracy:.4f}")
            
            self.recommendation_model = best_model
            
            # Train pricing model (single epoch as it's regression)
            self.train_pricing_model()
            
            # Train segmentation model
            self.train_segmentation_model()
            
            logger.info(f"\n🎉 Training completed!")
            logger.info(f"Best epoch: {self.training_history['best_epoch']}")
            logger.info(f"Best accuracy: {self.training_history['best_accuracy']:.4f}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error in epoch training: {str(e)}")
            return False
    
    def train_pricing_model(self):
        """Train pricing model"""
        try:
            logger.info("Training pricing model...")
            
            # Create synthetic price data
            price_mapping = {
                'Basic': 500, 'Standard': 1000, 'Deluxe': 2000,
                'Super Deluxe': 3500, 'King': 5000
            }
            
            self.processed_data['Base_Price'] = self.processed_data['ProductPitched'].map(price_mapping).fillna(1000)
            
            # Price adjustments
            income_adj = np.where(
                self.processed_data['MonthlyIncome'] > 100000, 1.4,
                np.where(self.processed_data['MonthlyIncome'] > 50000, 1.2, 1.0)
            )
            
            city_adj = np.where(
                self.processed_data['CityTier'] == 1, 1.3,
                np.where(self.processed_data['CityTier'] == 2, 1.1, 1.0)
            )
            
            self.processed_data['Price_Per_Person'] = (
                self.processed_data['Base_Price'] * income_adj * city_adj
            )
            
            # Prepare features
            pricing_features = [
                'Age', 'CityTier', 'NumberOfPersonVisiting', 'MonthlyIncome',
                'PreferredPropertyStar', 'NumberOfTrips', 'PitchSatisfactionScore'
            ]
            
            X_pricing = self.processed_data[pricing_features].fillna(0)
            y_pricing = self.processed_data['Price_Per_Person']
            
            X_pricing_scaled = StandardScaler().fit_transform(X_pricing)
            
            # Train model
            self.pricing_model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.pricing_model.fit(X_pricing_scaled, y_pricing)
            
            # Evaluate
            y_pred = self.pricing_model.predict(X_pricing_scaled)
            r2 = r2_score(y_pricing, y_pred)
            
            self.training_history['pricing_r2'].append(r2)
            logger.info(f"Pricing model R² score: {r2:.4f}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error training pricing model: {str(e)}")
            return False
    
    def train_segmentation_model(self):
        """Train customer segmentation model"""
        try:
            logger.info("Training segmentation model...")
            
            segmentation_features = [
                'Age', 'MonthlyIncome', 'NumberOfPersonVisiting', 
                'NumberOfTrips', 'PitchSatisfactionScore', 'CityTier'
            ]
            
            X_segment = self.processed_data[segmentation_features].fillna(
                self.processed_data[segmentation_features].median()
            )
            
            X_segment_scaled = StandardScaler().fit_transform(X_segment)
            
            # Train segmentation model
            self.segmentation_model = KMeans(n_clusters=5, random_state=42)
            segments = self.segmentation_model.fit_predict(X_segment_scaled)
            
            self.processed_data['Customer_Segment'] = segments
            
            logger.info("Customer segmentation completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error training segmentation model: {str(e)}")
            return False
    
    def save_models_and_results(self):
        """Save models and training results"""
        try:
            os.makedirs('models', exist_ok=True)
            
            # Save models
            model_files = {
                'recommendation_model.pkl': self.recommendation_model,
                'pricing_model.pkl': self.pricing_model,
                'segmentation_model.pkl': self.segmentation_model,
                'scaler.pkl': self.scaler,
                'label_encoders.pkl': self.label_encoders
            }
            
            for filename, model in model_files.items():
                if model is not None:
                    joblib.dump(model, f'models/{filename}')
                    logger.info(f"Saved {filename}")
            
            # Save training history
            with open('models/training_history.json', 'w') as f:
                json.dump(self.training_history, f, indent=2)
            
            # Save feature list
            with open('models/features.txt', 'w') as f:
                f.write("Recommendation Features:\n")
                for feature in self.recommendation_features:
                    f.write(f"- {feature}\n")
            
            # Save processed data sample for React frontend
            sample_data = self.processed_data.head(100).to_dict('records')
            with open('models/sample_data.json', 'w') as f:
                json.dump(sample_data, f, indent=2, default=str)
            
            logger.info("All models and results saved successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
            return False
    
    def generate_training_plots(self):
        """Generate training visualization plots"""
        try:
            if not os.path.exists('training_plots'):
                os.makedirs('training_plots')
            
            # Plot training accuracy over epochs
            plt.figure(figsize=(12, 4))
            
            plt.subplot(1, 2, 1)
            plt.plot(range(1, len(self.training_history['recommendation_accuracy']) + 1), 
                    self.training_history['recommendation_accuracy'], 'b-', marker='o')
            plt.title('Model Accuracy Over Epochs')
            plt.xlabel('Epoch')
            plt.ylabel('Accuracy')
            plt.grid(True, alpha=0.3)
            plt.axhline(y=self.training_history['best_accuracy'], color='r', 
                       linestyle='--', alpha=0.7, label=f'Best: {self.training_history["best_accuracy"]:.4f}')
            plt.legend()
            
            plt.subplot(1, 2, 2)
            plt.plot(range(1, len(self.training_history['epoch_times']) + 1), 
                    self.training_history['epoch_times'], 'g-', marker='s')
            plt.title('Training Time Per Epoch')
            plt.xlabel('Epoch')
            plt.ylabel('Time (seconds)')
            plt.grid(True, alpha=0.3)
            
            plt.tight_layout()
            plt.savefig('training_plots/epoch_progress.png', dpi=300, bbox_inches='tight')
            plt.close()
            
            logger.info("Training plots saved to training_plots/")
            return True
            
        except Exception as e:
            logger.error(f"Error generating plots: {str(e)}")
            return False
    
    def run_complete_training(self):
        """Run the complete epoch-based training pipeline"""
        logger.info("🚀 Starting Epoch-Based Training Pipeline")
        logger.info("=" * 60)
        
        steps = [
            ("Loading and Preprocessing Data", self.load_and_preprocess_data),
            ("Preparing Features", self.prepare_features),
            ("Training with Epochs", self.train_with_epochs),
            ("Saving Models and Results", self.save_models_and_results),
            ("Generating Training Plots", self.generate_training_plots)
        ]
        
        for step_name, step_func in steps:
            logger.info(f"\n🔄 {step_name}...")
            if not step_func():
                logger.error(f"❌ {step_name} failed! Training stopped.")
                return False
        
        logger.info("\n🎉 EPOCH-BASED TRAINING COMPLETED SUCCESSFULLY!")
        return True

def main():
    """Main training function with epoch control"""
    # Configuration
    CSV_PATH = "tour_package.csv"
    EPOCHS = 15  # You can adjust this number
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: {CSV_PATH} not found!")
        print("Please ensure tour_package.csv is in the current directory.")
        return
    
    # Initialize trainer
    trainer = EpochBasedTrainer(CSV_PATH, epochs=EPOCHS)
    
    # Run training
    success = trainer.run_complete_training()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 TRAINING SUCCESSFUL!")
        print(f"Best model achieved {trainer.training_history['best_accuracy']:.4f} accuracy")
        print(f"Best epoch: {trainer.training_history['best_epoch']}")
        print("Check 'models/' directory for saved files")
        print("Check 'training_plots/' for visualizations")
        print("=" * 60)
    else:
        print("\n❌ TRAINING FAILED!")
        print("Please check the error messages above")

if __name__ == "__main__":
    main()