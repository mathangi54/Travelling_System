from flask import jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime, timedelta
import jwt
import json
import pandas as pd
import os

def register_routes(app, mysql, ai_models, recommender, pricing_optimizer, chatbot, 
                   token_required, get_db_cursor, close_db_cursor, logger):
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "Sri Lanka Tourism API is running",
            "timestamp": datetime.now().isoformat()
        })

    # Authentication Routes
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
            
            cur.execute("""
                INSERT INTO users (username, email, password) VALUES (%s, %s, %s)
            """, (data['username'], data['email'], hashed_password))
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

    # Guides Routes
    @app.route('/api/guides', methods=['GET'])
    def get_guides():
        cur = None
        try:
            cur = get_db_cursor()
            cur.execute("SELECT * FROM guides ORDER BY rating DESC")
            guides = cur.fetchall()
            
            return jsonify({
                "status": "success",
                "data": [dict(guide) for guide in guides],
                "count": len(guides)
            })
        except Exception as e:
            logger.error(f"Error fetching guides: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    @app.route('/api/guides/<int:guide_id>', methods=['GET'])
    def get_guide_details(guide_id):
        cur = None
        try:
            cur = get_db_cursor()
            cur.execute("SELECT * FROM guides WHERE id = %s", (guide_id,))
            guide = cur.fetchone()
            
            if not guide:
                return jsonify({
                    "status": "error",
                    "message": "Guide not found"
                }), 404
            
            return jsonify({
                "status": "success",
                "data": dict(guide)
            })
            
        except Exception as e:
            logger.error(f"Error fetching guide details: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    # Guide Requests Routes
    @app.route('/api/guide-requests', methods=['GET', 'POST'])
    def handle_guide_requests():
        if request.method == 'GET':
            return get_guide_requests()
        else:
            return create_guide_request()

    def get_guide_requests():
        cur = None
        try:
            cur = get_db_cursor()
            
            # Get query parameters for filtering
            status = request.args.get('status')
            request_type = request.args.get('request_type')
            guide_id = request.args.get('guide_id')
            
            query = """
                SELECT gr.*, g.name as guide_name, g.email as guide_email, g.phone as guide_phone
                FROM guide_requests gr
                JOIN guides g ON gr.guide_id = g.id
                WHERE 1=1
            """
            params = []
            
            if status:
                query += " AND gr.status = %s"
                params.append(status)
            if request_type:
                query += " AND gr.request_type = %s"
                params.append(request_type)
            if guide_id:
                query += " AND gr.guide_id = %s"
                params.append(guide_id)
                
            query += " ORDER BY gr.created_at DESC"
            
            cur.execute(query, params)
            requests = cur.fetchall()
            
            return jsonify({
                "status": "success",
                "data": [dict(req) for req in requests],
                "count": len(requests)
            })
            
        except Exception as e:
            logger.error(f"Error fetching guide requests: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    def create_guide_request():
        cur = None
        try:
            data = request.get_json()
            logger.info(f"Received guide request data: {json.dumps(data, indent=2, default=str)}")
            
            # Validate required fields
            required_fields = ['guide_id', 'request_type', 'customer_name', 'customer_email', 'message']
            
            for field in required_fields:
                if field not in data or data[field] is None:
                    return jsonify({
                        "status": "error",
                        "message": f"Missing required field: {field}"
                    }), 400
            
            # Validate email format
            if not re.match(r"[^@]+@[^@]+\.[^@]+", data['customer_email']):
                return jsonify({
                    "status": "error",
                    "message": "Invalid email format"
                }), 400
            
            # Validate request type
            if data['request_type'] not in ['contact', 'booking']:
                return jsonify({
                    "status": "error",
                    "message": "Invalid request type. Must be 'contact' or 'booking'"
                }), 400
            
            # Validate preferred date if provided
            preferred_date = None
            if data.get('preferred_date'):
                try:
                    preferred_date = datetime.strptime(data['preferred_date'], '%Y-%m-%d').date()
                    if preferred_date < datetime.now().date():
                        return jsonify({
                            "status": "error",
                            "message": "Preferred date cannot be in the past"
                        }), 400
                except ValueError:
                    return jsonify({
                        "status": "error",
                        "message": "Invalid date format. Use YYYY-MM-DD"
                    }), 400
            
            cur = get_db_cursor()
            
            # Verify guide exists
            cur.execute("SELECT id FROM guides WHERE id = %s", (data['guide_id'],))
            if not cur.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Guide not found"
                }), 404
            
            # Insert guide request
            cur.execute("""
                INSERT INTO guide_requests 
                (guide_id, request_type, customer_name, customer_email, customer_phone, 
                 preferred_date, duration, group_size, tour_type, message, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['guide_id'],
                data['request_type'],
                data['customer_name'],
                data['customer_email'],
                data.get('customer_phone', ''),
                preferred_date,
                data.get('duration', ''),
                data.get('group_size', ''),
                data.get('tour_type', ''),
                data['message'],
                'pending'
            ))
            
            request_id = cur.lastrowid
            mysql.connection.commit()
            
            # Fetch the created request with guide info
            cur.execute("""
                SELECT gr.*, g.name as guide_name, g.email as guide_email, g.phone as guide_phone
                FROM guide_requests gr
                JOIN guides g ON gr.guide_id = g.id
                WHERE gr.id = %s
            """, (request_id,))
            created_request = cur.fetchone()
            
            logger.info(f"Guide request created successfully with ID: {request_id}")
            
            return jsonify({
                "status": "success",
                "message": "Guide request submitted successfully! The guide will contact you within 24 hours.",
                "data": {
                    "id": request_id,
                    "request_details": dict(created_request)
                }
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating guide request: {str(e)}")
            if cur:
                mysql.connection.rollback()
            return jsonify({
                "status": "error",
                "message": f"Failed to create guide request: {str(e)}"
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    @app.route('/api/guide-requests/<int:request_id>', methods=['PUT'])
    def update_guide_request_status(request_id):
        cur = None
        try:
            data = request.get_json()
            
            if 'status' not in data:
                return jsonify({
                    "status": "error",
                    "message": "Status is required"
                }), 400
            
            valid_statuses = ['pending', 'contacted', 'confirmed', 'cancelled']
            if data['status'] not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                }), 400
            
            cur = get_db_cursor()
            
            # Check if request exists
            cur.execute("SELECT id FROM guide_requests WHERE id = %s", (request_id,))
            if not cur.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Guide request not found"
                }), 404
            
            # Update status
            cur.execute("""
                UPDATE guide_requests 
                SET status = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            """, (data['status'], request_id))
            
            mysql.connection.commit()
            
            return jsonify({
                "status": "success",
                "message": "Guide request status updated successfully"
            })
            
        except Exception as e:
            logger.error(f"Error updating guide request: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    # Seed guides data
    @app.route('/api/seed-guides', methods=['GET'])
    def seed_guides():
        cur = None
        try:
            cur = get_db_cursor()
            
            # Clear existing guides
            cur.execute("DELETE FROM guides")
            logger.info("Cleared existing guides")
            
            # Insert Sri Lankan guides
            guides_data = [
                {
                    'name': 'Chaminda Perera',
                    'specialty': 'Cultural Heritage Tours',
                    'experience': '12 years',
                    'rating': 4.9,
                    'languages': ['English', 'Sinhala', 'Tamil'],
                    'image_url': 'https://images.unsplash.com/photo-1535077761702-4934a0669af9?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'bio': 'Born in Kandy, expert in Buddhist history and UNESCO World Heritage sites. Specializes in Cultural Triangle tours.',
                    'tours_completed': 485,
                    'specialities': ['Sigiriya & Dambulla', 'Kandy Temple Tours', 'Ancient Kingdoms'],
                    'phone': '+94 77 123 4567',
                    'email': 'chaminda@srilankaguides.com',
                    'price_range': '$50-80/day'
                },
                {
                    'name': 'Nimal Fernando',
                    'specialty': 'Wildlife & Nature Tours',
                    'experience': '15 years',
                    'rating': 4.95,
                    'languages': ['English', 'Sinhala', 'German'],
                    'image_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                    'bio': 'Wildlife biologist and safari guide with deep knowledge of Yala, Udawalawe and leopard behavior patterns.',
                    'tours_completed': 520,
                    'specialities': ['Leopard Safaris', 'Elephant Watching', 'Bird Photography'],
                    'phone': '+94 71 987 6543',
                    'email': 'nimal@wildlifeguides.lk',
                    'price_range': '$60-90/day'
                },
                {
                    'name': 'Priya Wickramasinghe',
                    'specialty': 'Tea Country & Hill Station Tours',
                    'experience': '8 years',
                    'rating': 4.88,
                    'languages': ['English', 'Sinhala', 'French'],
                    'image_url': 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'bio': 'Tea plantation heritage expert from Nuwara Eliya, specializing in Ceylon tea history and hill country adventures.',
                    'tours_completed': 320,
                    'specialities': ['Tea Factory Tours', 'Ella & Nine Arches', 'Mountain Trekking'],
                    'phone': '+94 76 555 2468',
                    'email': 'priya@teacountryguides.com',
                    'price_range': '$45-70/day'
                },
                {
                    'name': 'Ruwan Jayasuriya',
                    'specialty': 'Coastal & Adventure Tours',
                    'experience': '10 years',
                    'rating': 4.92,
                    'languages': ['English', 'Sinhala', 'Japanese'],
                    'image_url': 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'bio': 'Certified diving instructor and marine conservation advocate. Expert in southern coast attractions and whale watching.',
                    'tours_completed': 410,
                    'specialities': ['Whale Watching', 'Surfing Lessons', 'Coastal Heritage'],
                    'phone': '+94 75 333 7890',
                    'email': 'ruwan@coastalguides.lk',
                    'price_range': '$55-85/day'
                },
                {
                    'name': 'Kumari Silva',
                    'specialty': 'Culinary & Village Tours',
                    'experience': '6 years',
                    'rating': 4.87,
                    'languages': ['English', 'Sinhala', 'Tamil'],
                    'image_url': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
                    'bio': 'Traditional Sri Lankan chef and cultural ambassador. Offers authentic village experiences and cooking classes.',
                    'tours_completed': 285,
                    'specialities': ['Spice Garden Tours', 'Traditional Cooking', 'Village Experiences'],
                    'phone': '+94 78 444 1357',
                    'email': 'kumari@culinaryguides.com',
                    'price_range': '$40-65/day'
                },
                {
                    'name': 'Mahinda Rathnayake',
                    'specialty': 'Adventure & Pilgrimage Tours',
                    'experience': '14 years',
                    'rating': 4.91,
                    'languages': ['English', 'Sinhala', 'Hindi'],
                    'image_url': 'https://images.unsplash.com/photo-1517308883849-ceac3c24681e?q=80&w=686&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'bio': 'Mountain guide and meditation practitioner. Specializes in Adam\'s Peak pilgrimages and spiritual journeys.',
                    'tours_completed': 465,
                    'specialities': ['Adam\'s Peak Climb', 'Meditation Retreats', 'Sacred Sites'],
                    'phone': '+94 77 666 9012',
                    'email': 'mahinda@pilgrimguides.lk',
                    'price_range': '$50-75/day'
                }
            ]
            
            for guide in guides_data:
                cur.execute("""
                    INSERT INTO guides 
                    (name, specialty, experience, rating, languages, image_url, bio, 
                     tours_completed, specialities, phone, email, price_range)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    guide['name'],
                    guide['specialty'],
                    guide['experience'],
                    guide['rating'],
                    json.dumps(guide['languages']),
                    guide['image_url'],
                    guide['bio'],
                    guide['tours_completed'],
                    json.dumps(guide['specialities']),
                    guide['phone'],
                    guide['email'],
                    guide['price_range']
                ))
            
            mysql.connection.commit()
            
            # Verify insertion
            cur.execute("SELECT COUNT(*) as count FROM guides")
            count_result = cur.fetchone()
            count = count_result['count'] if count_result else 0
            
            logger.info(f"Successfully inserted {count} Sri Lankan guides")
            
            return jsonify({
                "status": "success",
                "message": f"Sri Lankan guides seeded successfully! Added {count} professional guides.",
                "guides_added": count
            })
            
        except Exception as e:
            logger.error(f"Error seeding guides data: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Failed to seed guides data: {str(e)}"
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    # Custom Tour Requests Routes
    @app.route('/api/custom-tour-requests', methods=['POST', 'OPTIONS'])
    def create_custom_tour_request():
        if request.method == 'OPTIONS':
            return '', 200
            
        cur = None
        try:
            data = request.get_json()
            logger.info(f"Received custom tour request data: {json.dumps(data, indent=2, default=str)}")
            
            # Validate required fields
            required_fields = ['customer_name', 'customer_email', 'customer_phone', 
                              'number_of_travelers', 'duration_days', 'budget_level', 
                              'selected_destinations', 'estimated_cost']
            
            for field in required_fields:
                if field not in data or data[field] is None:
                    return jsonify({
                        "status": "error",
                        "message": f"Missing required field: {field}"
                    }), 400
            
            # Validate email format
            if not re.match(r"[^@]+@[^@]+\.[^@]+", data['customer_email']):
                return jsonify({
                    "status": "error",
                    "message": "Invalid email format"
                }), 400
            
            # Validate budget level
            if data['budget_level'] not in ['low', 'medium', 'high', 'luxury']:
                return jsonify({
                    "status": "error",
                    "message": "Invalid budget level. Must be one of: low, medium, high, luxury"
                }), 400
            
            # Validate travel date if provided
            travel_date = None
            if data.get('travel_date'):
                try:
                    travel_date = datetime.strptime(data['travel_date'], '%Y-%m-%d').date()
                    if travel_date < datetime.now().date():
                        return jsonify({
                            "status": "error",
                            "message": "Travel date cannot be in the past"
                        }), 400
                except ValueError:
                    return jsonify({
                        "status": "error",
                        "message": "Invalid date format. Use YYYY-MM-DD"
                    }), 400
            
            # Validate numeric fields
            try:
                number_of_travelers = int(data['number_of_travelers'])
                duration_days = int(data['duration_days'])
                estimated_cost = float(data['estimated_cost'])
                
                if number_of_travelers < 1 or number_of_travelers > 50:
                    return jsonify({
                        "status": "error",
                        "message": "Number of travelers must be between 1 and 50"
                    }), 400
                
                if duration_days < 1 or duration_days > 30:
                    return jsonify({
                        "status": "error",
                        "message": "Duration must be between 1 and 30 days"
                    }), 400
                    
                if estimated_cost < 0:
                    return jsonify({
                        "status": "error",
                        "message": "Estimated cost cannot be negative"
                    }), 400
                    
            except (ValueError, TypeError) as e:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid numeric data: {str(e)}"
                }), 400
            
            cur = get_db_cursor()
            
            # Get user_id if authenticated
            user_id = None
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                try:
                    token = auth_header.split(" ")[1]
                    token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                    user_id = token_data['user_id']
                    
                    # Verify user exists
                    cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                    if not cur.fetchone():
                        user_id = None
                except jwt.InvalidTokenError:
                    user_id = None
            
            # Insert custom tour request
            cur.execute("""
                INSERT INTO custom_tour_requests 
                (user_id, customer_name, customer_email, customer_phone, travel_date, 
                 number_of_travelers, duration_days, budget_level, selected_destinations, 
                 destination_names, estimated_cost, special_requests, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                data['customer_name'],
                data['customer_email'],
                data['customer_phone'],
                travel_date,
                number_of_travelers,
                duration_days,
                data['budget_level'],
                json.dumps(data['selected_destinations']),
                json.dumps(data.get('destination_names', [])),
                estimated_cost,
                data.get('special_requests', ''),
                'pending'
            ))
            
            request_id = cur.lastrowid
            mysql.connection.commit()
            
            # Fetch the created request
            cur.execute("SELECT * FROM custom_tour_requests WHERE id = %s", (request_id,))
            created_request = cur.fetchone()
            
            logger.info(f"Custom tour request created successfully with ID: {request_id}")
            
            return jsonify({
                "status": "success",
                "message": "Custom tour request submitted successfully! Our travel experts will contact you within 24 hours to discuss your personalized Sri Lankan adventure.",
                "data": {
                    "id": request_id,
                    "request_details": dict(created_request)
                }
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating custom tour request: {str(e)}")
            if cur:
                mysql.connection.rollback()
            return jsonify({
                "status": "error",
                "message": f"Failed to create custom tour request: {str(e)}"
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    @app.route('/api/custom-tour-requests', methods=['GET'])
    def get_custom_tour_requests():
        cur = None
        try:
            cur = get_db_cursor()
            cur.execute("SELECT * FROM custom_tour_requests ORDER BY created_at DESC")
            requests = cur.fetchall()
            
            return jsonify({
                "status": "success",
                "data": [dict(req) for req in requests],
                "count": len(requests)
            })
            
        except Exception as e:
            logger.error(f"Error fetching custom tour requests: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    @app.route('/api/custom-tour-requests/<int:request_id>', methods=['PUT'])
    def update_custom_tour_request_status(request_id):
        cur = None
        try:
            data = request.get_json()
            
            if 'status' not in data:
                return jsonify({
                    "status": "error",
                    "message": "Status is required"
                }), 400
            
            valid_statuses = ['pending', 'reviewed', 'quoted', 'confirmed', 'cancelled']
            if data['status'] not in valid_statuses:
                return jsonify({
                    "status": "error",
                    "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                }), 400
            
            cur = get_db_cursor()
            
            # Check if request exists
            cur.execute("SELECT id FROM custom_tour_requests WHERE id = %s", (request_id,))
            if not cur.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Custom tour request not found"
                }), 404
            
            # Update status
            cur.execute("""
                UPDATE custom_tour_requests 
                SET status = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            """, (data['status'], request_id))
            
            mysql.connection.commit()
            
            return jsonify({
                "status": "success",
                "message": "Custom tour request status updated successfully"
            })
            
        except Exception as e:
            logger.error(f"Error updating custom tour request: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if cur:
                close_db_cursor(cur)

    # Tours Routes
    @app.route('/api/tours', methods=['GET'])
    def get_tours():
        cur = None
        try:
            cur = get_db_cursor()
            cur.execute("SELECT * FROM tours ORDER BY name")
            tours = cur.fetchall()
            
            return jsonify({
                "status": "success",
                "data": [dict(tour) for tour in tours],
                "count": len(tours)
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
            
            return jsonify({
                "status": "success",
                "data": dict(tour)
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

    # Utility Routes
    @app.route('/api/seed-sri-lanka', methods=['GET'])
    def seed_sri_lankan_data():
        cur = None
        try:
            cur = get_db_cursor()
            
            # Clear existing tours
            cur.execute("DELETE FROM tours")
            logger.info("Cleared existing tours")
            
            # Insert 12 Sri Lankan destinations
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
            
            logger.info(f"Successfully inserted {count} Sri Lankan tours")
            
            return jsonify({
                "status": "success",
                "message": f"Sri Lankan destinations seeded successfully! Added {count} authentic Sri Lankan tours.",
                "tours_added": count
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

    # Debug Routes
    @app.route('/api/test-custom-tour', methods=['POST', 'OPTIONS'])
    def test_custom_tour():
        if request.method == 'OPTIONS':
            return '', 200
            
        try:
            data = request.get_json()
            logger.info(f"Received test data: {data}")
            
            return jsonify({
                "status": "success",
                "message": "Custom tour endpoint is working!",
                "received_data": data,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"Test error: {str(e)}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500