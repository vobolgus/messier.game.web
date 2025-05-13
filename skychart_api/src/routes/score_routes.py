from flask import Blueprint, request, jsonify
from ..models.models import db, Score, User # Adjusted import path
from .auth_routes import token_required # Import the token_required decorator
from sqlalchemy import desc

score_bp = Blueprint("score_bp", __name__)

@score_bp.route("/scores", methods=["POST"])
@token_required
def submit_score(current_user):
    data = request.get_json()
    if not data or "score" not in data or "difficulty" not in data:
        return jsonify({"message": "Score and difficulty are required!"}), 400

    try:
        score_value = int(data["score"])
        difficulty_value = str(data["difficulty"])
    except ValueError:
        return jsonify({"message": "Invalid score or difficulty format!"}), 400

    new_score = Score(user_id=current_user.id, score=score_value, difficulty=difficulty_value)
    try:
        db.session.add(new_score)
        db.session.commit()
        return jsonify({"message": "Score submitted successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Could not submit score.", "error": str(e)}), 500

@score_bp.route("/scoreboard", methods=["GET"])
def get_scoreboard():
    try:
        # Query top 10 scores, joining with User to get username
        top_scores = db.session.query(
            Score.score,
            Score.difficulty,
            Score.timestamp,
            User.username
        ).join(User, Score.user_id == User.id)
        .order_by(desc(Score.score))
        .limit(10)
        .all()

        scoreboard = [
            {
                "username": score.username,
                "score": score.score,
                "difficulty": score.difficulty,
                "timestamp": score.timestamp.isoformat() # Format datetime to string
            }
            for score in top_scores
        ]
        return jsonify(scoreboard), 200
    except Exception as e:
        return jsonify({"message": "Could not retrieve scoreboard.", "error": str(e)}), 500

