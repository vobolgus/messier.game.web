# DON'T CHANGE THIS !!!
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS # Import CORS

# Import blueprints and db instance
from src.models.models import db # Adjusted import for db
from src.routes.auth_routes import auth_bp
from src.routes.score_routes import score_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
CORS(app) # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_default_secret_key_for_dev') # Use environment variable for production

# PostgreSQL Database Configuration (for Railway or local)
# Railway provides DATABASE_URL. For local, you might set DB_USER, DB_PASSWORD, etc.
if os.getenv('DATABASE_URL'):
    # For Railway and other services that provide a DATABASE_URL
    db_url = os.getenv('DATABASE_URL').replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
else:
    # Fallback for local development if DATABASE_URL is not set
    db_user = os.getenv('DB_USER', 'postgres') # Default to 'postgres' or your local user
    db_password = os.getenv('DB_PASSWORD', 'password') # Your local password
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'skychart_db') # Your local database name
    app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth') # Added /auth prefix for clarity
app.register_blueprint(score_bp, url_prefix='/api') # score_bp routes are /scores and /scoreboard

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# Serve static files (React build) - This part is usually for when Flask serves the frontend too.
# For a separate React frontend, this might not be strictly necessary if React is served by its own server (e.g., Nginx on Railway).
# However, it's good practice to have a default route.
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            # This will serve the React app's index.html for any route not matched by the API
            return send_from_directory(static_folder_path, 'index.html')
        else:
            # If no index.html, and not an API route, return a simple message or 404 for API base
            if request.path.startswith('/api'):
                 return jsonify({"message": "API endpoint not found"}), 404
            return "Skychart API is running. Frontend not found at static path or not an API call.", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True) # Use PORT env var for Railway

