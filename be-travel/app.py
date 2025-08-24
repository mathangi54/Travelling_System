from flask import Flask, jsonify, request
from flask_mysqldb import MySQL
from flask_cors import CORS
import pymysql
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime, timedelta  # Fixed import
import logging
import jwt
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'tour_system'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
app.config['MYSQL_CONNECT_TIMEOUT'] = 10

mysql = MySQL(app)

# JWT Token Required Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
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

def init_db():
    """Initialize database tables"""
    try:
        with app.app_context():
            cur = mysql.connection.cursor()
            
            # Tours Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS tours (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_days INT,
                image_url VARCHAR(255) DEFAULT 'https://placehold.co/400x300?text=Default+Tour',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Users Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'guide', 'customer') DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Bookings Table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                tour_id INT NOT NULL,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                travel_date DATE NOT NULL,
                guests INT NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                special_requests TEXT,
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
                package_type VARCHAR(50) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
            )
            """)
            
            # Create indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)")
            
            mysql.connection.commit()
            logger.info("Database tables initialized successfully!")
            return True
    except pymysql.Error as e:
        logger.error(f"Database Error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        return False

@app.route('/api/seed', methods=['GET'])
def seed_data():
    """Seed the database with sample tour data"""
    try:
        with app.app_context():
            cur = mysql.connection.cursor()
            cur.execute("SELECT COUNT(*) AS count FROM tours")
            tour_count = cur.fetchone()['count']
            if tour_count > 0:
                logger.info(f"Skipping seed: {tour_count} tours already exist")
                return jsonify({
                    "status": "success",
                    "message": f"Database already contains {tour_count} tours"
                })
            
            cur.execute("""
                INSERT INTO tours (name, description, price, duration_days, image_url)
                VALUES 
                    ('Standard Package', 'Basic tour package with essential amenities', 100.00, 3, 'https://placehold.co/400x300?text=Standard+Package'),
                    ('Premium Package', 'Enhanced experience with additional services', 200.00, 5, 'https://placehold.co/400x300?text=Premium+Package'),
                    ('Deluxe Package', 'Luxury experience with premium services', 350.00, 7, 'https://placehold.co/400x300?text=Deluxe+Package')
            """)
            
            # Add a default admin user
            hashed_password = generate_password_hash('admin123')
            cur.execute("""
                INSERT INTO users (username, email, password, role)
                VALUES ('admin', 'admin@tours.com', %s, 'admin')
            """, (hashed_password,))
            
            mysql.connection.commit()
            logger.info("Seed data added successfully!")
            return jsonify({
                "status": "success",
                "message": "Seed data added successfully"
            })
    except pymysql.Error as e:
        logger.error(f"Database error during seeding: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error during seeding: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        logger.debug(f"Registration data: {data}")
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return jsonify({
                "status": "error",
                "message": "Invalid email format"
            }), 400
        
        # Validate password length
        if len(data['password']) < 6:
            return jsonify({
                "status": "error",
                "message": "Password must be at least 6 characters"
            }), 400
        
        # Check if user exists
        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", 
                   (data['email'], data['username']))
        if cur.fetchone():
            return jsonify({
                "status": "error",
                "message": "User already exists"
            }), 409
        
        # Hash password and create user
        hashed_password = generate_password_hash(data['password'])
        cur.execute("""
            INSERT INTO users (username, email, password)
            VALUES (%s, %s, %s)
        """, (data['username'], data['email'], hashed_password))
        mysql.connection.commit()
        
        # Get the newly created user
        cur.execute("SELECT id, username, email, role FROM users WHERE email = %s", (data['email'],))
        user = cur.fetchone()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)  # Fixed datetime usage
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "status": "success",
            "message": "User registered successfully",
            "data": {
                "user": user,
                "token": token
            }
        }), 201
        
    except pymysql.Error as e:
        logger.error(f"Database error during registration: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return token"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({
                "status": "error",
                "message": "Email and password are required"
            }), 400
        
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cur.fetchone()
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)  # Fixed datetime usage
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
        
    except pymysql.Error as e:
        logger.error(f"Database error during login: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user details"""
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, username, email, role FROM users WHERE id = %s", (current_user,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404
            
        return jsonify({
            "status": "success",
            "data": user
        })
    except pymysql.Error as e:
        logger.error(f"Database error fetching user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error fetching user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/bookings', methods=['POST'])
@token_required
def create_booking(current_user):
    """Create a new booking with enhanced validation"""
    try:
        data = request.get_json()
        logger.debug(f"Received booking data: {data}")
        
        # Enhanced validation
        required_fields = {
            'packageId': int,
            'date': str,
            'persons': int,
            'totalPrice': (int, float),
            'customerInfo': dict,
            'packageType': str
        }
        
        for field, field_type in required_fields.items():
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
            
            if not isinstance(data[field], field_type):
                logger.error(f"Invalid type for {field}. Expected {field_type}, got {type(data[field])}")
                return jsonify({
                    "status": "error",
                    "message": f"Invalid type for {field}. Expected {field_type.__name__ if hasattr(field_type, '__name__') else 'int or float'}"
                }), 400
        
        # Customer info validation
        customer_info = data['customerInfo']
        required_customer_fields = {
            'fullName': str,
            'email': str,
            'phone': str
        }
        
        for field, field_type in required_customer_fields.items():
            if field not in customer_info:
                logger.error(f"Missing required customer field: {field}")
                return jsonify({
                    "status": "error",
                    "message": f"Missing required customer field: {field}"
                }), 400
            
            if not isinstance(customer_info[field], field_type):
                logger.error(f"Invalid type for customer {field}. Expected {field_type}, got {type(customer_info[field])}")
                return jsonify({
                    "status": "error",
                    "message": f"Invalid type for customer {field}. Expected {field_type.__name__}"
                }), 400
        
        # Email validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", customer_info['email']):
            logger.error(f"Invalid email format: {customer_info['email']}")
            return jsonify({
                "status": "error",
                "message": "Invalid email format"
            }), 400
        
        # Date validation
        try:
            travel_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            if travel_date < datetime.utcnow().date():  # Fixed datetime usage
                logger.error(f"Travel date cannot be in the past: {data['date']}")
                return jsonify({
                    "status": "error",
                    "message": "Travel date cannot be in the past"
                }), 400
        except ValueError:
            logger.error(f"Invalid date format: {data['date']}")
            return jsonify({
                "status": "error",
                "message": "Invalid date format. Use YYYY-MM-DD"
            }), 400

        with app.app_context():
            cur = mysql.connection.cursor()
            
            # Check if tour exists
            cur.execute("SELECT id, name, price FROM tours WHERE id = %s", (data['packageId'],))
            tour = cur.fetchone()
            if not tour:
                logger.error(f"Tour not found with ID: {data['packageId']}")
                return jsonify({
                    "status": "error",
                    "message": f"Tour not found with ID: {data['packageId']}"
                }), 404
            
            # Insert booking with all details
            cur.execute("""
                INSERT INTO bookings (
                    user_id,
                    tour_id,
                    travel_date,
                    guests,
                    total_price,
                    customer_name,
                    customer_email,
                    customer_phone,
                    special_requests,
                    package_type,
                    status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'confirmed')
            """, (
                current_user,
                data['packageId'],
                data['date'],
                data['persons'],
                data['totalPrice'],
                customer_info['fullName'],
                customer_info['email'],
                customer_info['phone'],
                customer_info.get('specialRequests', ''),
                data['packageType']
            ))
            
            mysql.connection.commit()
            booking_id = cur.lastrowid
            
            # Get the full booking details to return
            cur.execute("""
                SELECT 
                    b.id, b.booking_date, b.travel_date, b.guests, 
                    b.total_price, b.customer_name, b.customer_email,
                    b.customer_phone, b.special_requests, b.status,
                    b.package_type,
                    t.name as tour_name, t.description as tour_description,
                    t.price as tour_price, t.image_url as tour_image
                FROM bookings b
                JOIN tours t ON b.tour_id = t.id
                WHERE b.id = %s
            """, (booking_id,))
            booking_details = cur.fetchone()
            
            logger.info(f"Booking created successfully with ID: {booking_id}")
            
            return jsonify({
                "status": "success",
                "message": "Booking created successfully",
                "data": booking_details
            })
            
    except pymysql.Error as e:
        logger.error(f"Database error during booking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error during booking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/bookings/<int:booking_id>', methods=['GET'])
@token_required
def get_booking(current_user, booking_id):
    """Get booking details by ID"""
    try:
        with app.app_context():
            cur = mysql.connection.cursor()
            cur.execute("""
                SELECT 
                    b.id, b.booking_date, b.travel_date, b.guests, 
                    b.total_price, b.customer_name, b.customer_email,
                    b.customer_phone, b.special_requests, b.status,
                    b.package_type,
                    t.name as tour_name, t.description as tour_description,
                    t.price as tour_price, t.image_url as tour_image
                FROM bookings b
                JOIN tours t ON b.tour_id = t.id
                WHERE b.id = %s AND (b.user_id = %s OR %s IN (SELECT id FROM users WHERE role = 'admin'))
            """, (booking_id, current_user, current_user))
            booking = cur.fetchone()
            
            if not booking:
                return jsonify({
                    "status": "error",
                    "message": "Booking not found or unauthorized"
                }), 404
                
            return jsonify({
                "status": "success",
                "data": booking
            })
            
    except pymysql.Error as e:
        logger.error(f"Database error fetching booking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error fetching booking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/tours', methods=['GET'])
def get_tours():
    """Fetch all tours"""
    try:
        with app.app_context():
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM tours")
            tours = cur.fetchall()
            logger.info(f"Fetched {len(tours)} tours")
            return jsonify({
                "status": "success",
                "data": tours
            })
    except pymysql.Error as e:
        logger.error(f"Error fetching tours: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error fetching tours: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

# Initialize database when app starts
with app.app_context():
    init_db()
    seed_data()

@app.route('/')
def home():
    return jsonify({
        "status": "success",
        "message": "Welcome to the Tour System API",
        "endpoints": {
            "auth": {
                "register": "/api/auth/register",
                "login": "/api/auth/login",
                "me": "/api/auth/me"
            },
            "tours": "/api/tours",
            "bookings": "/api/bookings",
            "seed": "/api/seed"
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)