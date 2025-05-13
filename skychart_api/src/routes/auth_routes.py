from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

from ..models.models import db, User # Adjusted import path
from flask import current_app # To access app.config

auth_bp = Blueprint("auth_bp", __name__)

# Decorator for verifying the JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "x-access-token" in request.headers:
            token = request.headers["x-access-token"]
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data["user_id"]).first()
            if not current_user:
                return jsonify({"message": "Token is invalid!"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password") or not data.get("email"):
        return jsonify({"message": "Username, email, and password are required!"}), 400

    hashed_password = generate_password_hash(data["password"], method="pbkdf2:sha256")
    new_user = User(username=data["username"], email=data["email"], password_hash=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "New user created!"}), 201
    except Exception as e:
        db.session.rollback()
        # Check if it's a unique constraint violation
        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
             return jsonify({"message": "Username or email already exists."}), 409
        return jsonify({"message": "Could not create user.", "error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    auth = request.authorization
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Could not verify", "WWW-Authenticate": "Basic realm=\"Login required!\""}), 401

    user = User.query.filter_by(username=data["username"]).first()

    if not user:
        return jsonify({"message": "User not found!"}), 401

    if check_password_hash(user.password_hash, data["password"]):
        token = jwt.encode({
            "user_id": user.id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, current_app.config["SECRET_KEY"], algorithm="HS256")
        return jsonify({"token": token, "username": user.username, "user_id": user.id}), 200

    return jsonify({"message": "Could not verify password!"}), 401

