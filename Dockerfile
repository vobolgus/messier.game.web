# Dockerfile for Flask Backend (skychart_api)

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY ./skychart_project/skychart_api/requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
# Using --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the local skychart_api directory contents into the container at /app
COPY ./skychart_project/skychart_api/src /app/src

# Make port 5000 available to the world outside this container
# Railway will automatically use the PORT environment variable if set, or default to this.
EXPOSE 5000

# Define environment variable for Flask app (can be overridden)
ENV FLASK_APP src/main.py
ENV FLASK_RUN_HOST 0.0.0.0
ENV FLASK_ENV production

# Command to run the application using Gunicorn (a production WSGI server)
# Railway often injects its own start command or uses a Procfile, but this is a good default.
# Ensure Gunicorn is in requirements.txt if you use it directly here.
# For now, we assume Flask dev server for simplicity, but Gunicorn is better for production.
# If Gunicorn is added to requirements.txt: CMD ["gunicorn", "--bind", "0.0.0.0:5000", "src.main:app"]
# For simplicity with the current setup, using Flask's built-in server (not recommended for true production outside of managed platforms like Railway that might handle this).
CMD ["python", "src/main.py"]
