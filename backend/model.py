import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime, timedelta

# Model file path
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_crowd.db')

# Initialize label encoders
location_encoder = LabelEncoder()

def get_crowd_level(count):
    """Convert count to crowd level."""
    if count <= 10:
        return "low"
    elif count <= 25:
        return "medium"
    else:
        return "high"

def retrain():
    """Retrain GradientBoostingRegressor model with latest crowd data."""
    # Load data from database
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query('SELECT location, timestamp, person_count FROM crowd_logs', conn)
    conn.close()
    
    if df.empty:
        print("❌ No data available for training")
        return False
    
    if len(df) < 10:
        print("❌ Need at least 10 records for training")
        return False
    
    # Extract features
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['minute'] = df['timestamp'].dt.minute
    df['day_of_week'] = df['timestamp'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)  # 1 for weekend, 0 for weekday
    
    # Encode categorical variables
    df['location_encoded'] = location_encoder.fit_transform(df['location'])
    
    # Prepare features and target
    features = ['hour', 'minute', 'day_of_week', 'is_weekend', 'location_encoded']
    X = df[features]
    y = df['person_count']
    
    # Train GradientBoostingRegressor model
    model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save model and encoder
    model_data = {
        'model': model,
        'location_encoder': location_encoder
    }
    joblib.dump(model_data, MODEL_PATH)
    
    print(f"✅ Model trained successfully with {len(df)} records")
    return True

def predict_count(location, hour, minute, day_of_week):
    """Predict person count for a given location and time."""
    if not os.path.exists(MODEL_PATH):
        print("❌ Model not found. Please train model first.")
        return None
    
    # Load model and encoder
    model_data = joblib.load(MODEL_PATH)
    model = model_data['model']
    location_encoder = model_data['location_encoder']
    
    # Prepare input features
    try:
        location_encoded = location_encoder.transform([location])[0]
    except ValueError:
        print(f"❌ Location '{location}' not found in training data")
        return None
    
    is_weekend = 1 if day_of_week >= 5 else 0
    features = np.array([[hour, minute, day_of_week, is_weekend, location_encoded]])
    
    # Make prediction
    predicted_count = max(0, model.predict(features)[0])  # Ensure non-negative
    predicted_level = get_crowd_level(predicted_count)
    
    return {
        'predicted_count': int(round(predicted_count)),
        'predicted_level': predicted_level
    }

def predict(location, hour, day_of_week):
    """Predict crowd level for backward compatibility."""
    result = predict_count(location, hour, 0, day_of_week)
    return result['predicted_level'] if result else None

def predict_next_hour(location):
    """Generate predictions for next 60 minutes in 5 minute gaps."""
    if not os.path.exists(MODEL_PATH):
        return []
    
    now = datetime.now()
    predictions = []
    
    for minutes_ahead in range(5, 65, 5):  # 5, 10, 15, ..., 60
        future_time = now + timedelta(minutes=minutes_ahead)
        hour = future_time.hour
        minute = future_time.minute
        day_of_week = future_time.weekday()
        
        result = predict_count(location, hour, minute, day_of_week)
        if result:
            time_str = future_time.strftime('%I:%M %p').lstrip('0')
            predictions.append({
                'time': time_str,
                'predicted_count': result['predicted_count'],
                'predicted_level': result['predicted_level']
            })
    
    return predictions

def predict_next_3_hours(location):
    """Generate predictions for next 3 hours in 1 hour gaps."""
    if not os.path.exists(MODEL_PATH):
        return []
    
    now = datetime.now()
    predictions = []
    
    for hours_ahead in range(1, 4):  # 1, 2, 3 hours ahead
        future_time = now + timedelta(hours=hours_ahead)
        hour = future_time.hour
        day_of_week = future_time.weekday()
        
        result = predict_count(location, hour, 0, day_of_week)
        if result:
            predictions.append({
                'hour': hour,
                'predicted_count': result['predicted_count'],
                'predicted_level': result['predicted_level']
            })
    
    return predictions

def get_best_time(location, day_of_week=None):
    """Find the best time (lowest predicted count) for a given location."""
    if day_of_week is None:
        day_of_week = datetime.now().weekday()
    
    best_hour = None
    min_count = None
    
    # Test hours from 7 AM to 9 PM
    for hour in range(7, 22):
        result = predict_count(location, hour, 0, day_of_week)
        if result and result['predicted_count'] is not None:
            if min_count is None or result['predicted_count'] < min_count:
                min_count = result['predicted_count']
                best_hour = hour
    
    if best_hour is not None:
        # Convert to 12-hour format
        period = 'AM' if best_hour < 12 else 'PM'
        display_hour = best_hour if best_hour <= 12 else best_hour - 12
        time_str = f"{display_hour}:00 {period}"
        return time_str
    
    return None

def get_worst_time(location, day_of_week=None):
    """Find the worst time (highest predicted count) for a given location."""
    if day_of_week is None:
        day_of_week = datetime.now().weekday()
    
    worst_hour = None
    max_count = None
    
    # Test hours from 7 AM to 9 PM
    for hour in range(7, 22):
        result = predict_count(location, hour, 0, day_of_week)
        if result and result['predicted_count'] is not None:
            if max_count is None or result['predicted_count'] > max_count:
                max_count = result['predicted_count']
                worst_hour = hour
    
    if worst_hour is not None:
        # Convert to 12-hour format
        period = 'AM' if worst_hour < 12 else 'PM'
        display_hour = worst_hour if worst_hour <= 12 else worst_hour - 12
        time_str = f"{display_hour}:00 {period}"
        return time_str
    
    return None
