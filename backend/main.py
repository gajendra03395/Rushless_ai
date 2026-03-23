from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import sqlite3
import os
from typing import List, Dict, Any, Optional

from database import init_db, log_crowd, get_logs, get_all_locations, get_recent_logs
from model import retrain, predict, get_best_time, get_worst_time, predict_next_hour, predict_next_3_hours, get_crowd_level
from yolo_counter import count_people, get_crowd_level
import pandas as pd

# Initialize FastAPI app
app = FastAPI(title="Rushless AI - Campus Crowd Detection System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_crowd.db')

@app.on_event("startup")
async def startup_event():
    """Initialize database and train model on startup."""
    print("🚀 Starting Rushless AI Backend...")
    init_db()
    retrain()
    print("✅ Backend ready!")

@app.post("/upload/{location}")
async def upload_image(location: str, file: UploadFile = File(...)):
    """Upload image for crowd detection at a specific location."""
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Count people using YOLO
        person_count = count_people(image_bytes)
        crowd_level = get_crowd_level(person_count)
        
        # Log to database
        log_crowd(location, person_count, crowd_level)
        
        # Retrain model with new data
        retrain()
        
        # Get recommendations
        best_time = get_best_time(location)
        worst_time = get_worst_time(location)
        go_now = crowd_level == "low"
        
        if go_now:
            recommendation = "✅ Go Now! Crowd is low."
        elif crowd_level == "medium":
            recommendation = f"⚠️ Wait. Crowd is medium, best time is {best_time}"
        else:
            recommendation = f"🚫 Avoid! Too crowded. Visit after {worst_time}"
        
        return {
            "location": location,
            "person_count": person_count,
            "crowd_level": crowd_level,
            "go_now": go_now,
            "recommendation": recommendation,
            "best_time_to_visit": best_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/crowd/{location}")
async def get_crowd_info(location: str):
    """Get current crowd information and recent logs for a location."""
    try:
        # Get latest 10 logs
        logs = get_logs(location)[:10]
        
        if not logs:
            raise HTTPException(status_code=404, detail=f"No data found for location: {location}")
        
        # Get latest log
        latest_log = logs[0]
        current_level = latest_log[3]
        
        # Get recommendations
        best_time = get_best_time(location)
        worst_time = get_worst_time(location)
        go_now = current_level == "low"
        
        if go_now:
            recommendation = "✅ Go Now! Crowd is low."
        elif current_level == "medium":
            recommendation = f"⚠️ Wait. Crowd is medium, best time is {best_time}"
        else:
            recommendation = f"🚫 Avoid! Too crowded. Visit after {worst_time}"
        
        return {
            "location": location,
            "current_count": latest_log[2],
            "current_level": current_level,
            "go_now": go_now,
            "recommendation": recommendation,
            "best_time": best_time,
            "recent_logs": [
                {
                    "id": log[0],
                    "person_count": log[2],
                    "crowd_level": log[3],
                    "timestamp": log[4]
                }
                for log in logs
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching crowd info: {str(e)}")

@app.get("/predict/{location}")
async def get_predictions(location: str):
    """Get crowd predictions for next 3 hours."""
    try:
        predictions = predict_next_3_hours(location)
        
        return {
            "location": location,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

@app.get("/heatmap")
async def get_heatmap_data():
    """Get heatmap data grouped by location, day, and hour."""
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query('SELECT * FROM crowd_logs', conn)
        conn.close()
        
        if df.empty:
            return {"heatmap_data": []}
        
        # Convert timestamp and extract features
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['hour'] = df['timestamp'].dt.hour
        
        # Map crowd levels to numeric values
        level_map = {'low': 1, 'medium': 2, 'high': 3}
        df['level_numeric'] = df['crowd_level'].map(level_map)
        
        # Group by location, day, hour and calculate averages
        grouped = df.groupby(['location', 'day_of_week', 'hour'])['level_numeric'].mean().reset_index()
        
        heatmap_data = [
            {
                "location": row['location'],
                "day": int(row['day_of_week']),
                "hour": int(row['hour']),
                "avg_level": round(row['level_numeric'], 2)
            }
            for _, row in grouped.iterrows()
        ]
        
        return {"heatmap_data": heatmap_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating heatmap: {str(e)}")

@app.get("/best-time/{location}")
async def get_best_time_location(location: str):
    """Get the best time to visit a location (lowest predicted crowd)."""
    try:
        best_time = get_best_time(location)
        if best_time:
            return {
                "location": location,
                "best_hour": best_time,
                "message": f"Best time to visit is {best_time}"
            }
        else:
            raise HTTPException(status_code=404, detail=f"Could not determine best time for {location}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding best time: {str(e)}")

@app.get("/history")
async def get_history(limit: int = 100):
    """Get crowd logs with optional limit parameter."""
    try:
        # Validate limit
        limit = min(max(limit, 1), 200)  # Between 1 and 200
        
        logs = get_logs()
        history = [
            {
                "id": log[0],
                "location": log[1],
                "person_count": log[2],
                "crowd_level": log[3],
                "timestamp": log[4]
            }
            for log in logs[:limit]  # Limit results
        ]
        
        return {
            "history": history,
            "total_count": len(logs),
            "showing": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/analytics/{location}")
async def get_analytics(location: str):
    """Get detailed analytics for a specific location."""
    try:
        # Use get_recent_logs to limit to 50 entries
        logs = get_recent_logs(location, 50)
        if not logs:
            raise HTTPException(status_code=404, detail=f"No data found for location: {location}")
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(logs, columns=['id', 'loc', 'person_count', 'crowd_level', 'timestamp'])
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        
        # Calculate hourly averages grouped by hour only
        hourly_avg = df.groupby('hour').agg({
            'person_count': 'mean'
        }).reset_index()
        
        hourly_averages = [
            {
                "hour": int(row['hour']),
                "avg_count": round(row['person_count'], 1)
            }
            for _, row in hourly_avg.iterrows()
        ]
        
        # Sort by hour ascending
        hourly_averages.sort(key=lambda x: x['hour'])
        
        return {
            "location": location,
            "logs": [
                {
                    "id": log[0],
                    "person_count": log[2],
                    "crowd_level": log[3],
                    "timestamp": log[4]
                }
                for log in logs
            ],
            "hourly_averages": hourly_averages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

@app.get("/weekly-report")
async def get_weekly_report():
    """Generate weekly crowd report."""
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query('SELECT * FROM crowd_logs', conn)
        conn.close()
        
        if df.empty:
            return {"weekly_data": [], "most_crowded": [], "quietest_hours": []}
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['hour'] = df['timestamp'].dt.hour
        
        # Map crowd levels to numeric for comparison
        level_map = {'low': 1, 'medium': 2, 'high': 3}
        df['level_numeric'] = df['crowd_level'].map(level_map)
        
        # Most crowded location per day
        most_crowded = df.groupby(['day_of_week', 'location'])['level_numeric'].mean().groupby('day_of_week').idxmax().apply(lambda x: x[1])
        most_crowded_data = [
            {"day": int(day), "location": loc}
            for day, loc in most_crowded.items()
        ]
        
        # Quietest hour per location
        quietest_hours = df.groupby(['location', 'hour'])['level_numeric'].mean().groupby('location').idxmin().apply(lambda x: x[1])
        quietest_hours_data = [
            {"location": loc, "quietest_hour": int(hour)}
            for loc, hour in quietest_hours.items()
        ]
        
        # Weekly data summary
        weekly_data = df.groupby(['day_of_week', 'location']).agg({
            'person_count': 'mean',
            'level_numeric': 'mean'
        }).reset_index()
        
        weekly_summary = [
            {
                "day": int(row['day_of_week']),
                "location": row['location'],
                "avg_count": round(row['person_count'], 1),
                "avg_level": round(row['level_numeric'], 2)
            }
            for _, row in weekly_data.iterrows()
        ]
        
        return {
            "weekly_data": weekly_summary,
            "most_crowded": most_crowded_data,
            "quietest_hours": quietest_hours_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating weekly report: {str(e)}")

@app.get("/locations")
async def get_locations():
    """Get all available locations."""
    try:
        locations = get_all_locations()
        return {
            "locations": [
                {
                    "id": loc[0],
                    "name": loc[1],
                    "description": loc[2]
                }
                for loc in locations
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching locations: {str(e)}")

@app.post("/locations")
async def add_location(location_data: Dict[str, str] = Body(...)):
    """Add a new location."""
    try:
        name = location_data.get("name")
        description = location_data.get("description", "")
        
        if not name:
            raise HTTPException(status_code=400, detail="Location name is required")
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO locations (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
        conn.close()
        
        return {
            "message": f"Location '{name}' added successfully",
            "location": {"name": name, "description": description}
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"Location '{name}' already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding location: {str(e)}")

@app.delete("/locations/{name}")
async def delete_location(name: str):
    """Delete a location."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if location exists
        cursor.execute('SELECT id FROM locations WHERE name = ?', (name,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Location '{name}' not found")
        
        # Delete location
        cursor.execute('DELETE FROM locations WHERE name = ?', (name,))
        conn.commit()
        conn.close()
        
        return {"message": f"Location '{name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting location: {str(e)}")

@app.put("/crowd/{location}")
async def manual_log_crowd(location: str, crowd_data: Dict[str, str] = Body(...)):
    """Manually log crowd level for a location."""
    try:
        crowd_level = crowd_data.get("crowd_level")
        
        if crowd_level not in ["low", "medium", "high"]:
            raise HTTPException(status_code=400, detail="crowd_level must be 'low', 'medium', or 'high'")
        
        # Map crowd level to count
        count_map = {"low": 0, "medium": 15, "high": 30}
        person_count = count_map[crowd_level]
        
        # Log to database
        log_crowd(location, person_count, crowd_level)
        
        # Retrain model with new data
        retrain()
        
        # Get updated recommendations
        best_time = get_best_time(location)
        worst_time = get_worst_time(location)
        go_now = crowd_level == "low"
        
        if go_now:
            recommendation = "✅ Go Now! Crowd is low."
        elif crowd_level == "medium":
            recommendation = f"⚠️ Wait. Crowd is medium, best time is {best_time}"
        else:
            recommendation = f"🚫 Avoid! Too crowded. Visit after {worst_time}"
        
        return {
            "success": True,
            "location": location,
            "crowd_level": crowd_level,
            "person_count": person_count,
            "go_now": go_now,
            "recommendation": recommendation,
            "best_time": best_time,
            "message": "Override applied successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging crowd: {str(e)}")

@app.get("/crowd/all")
async def get_all_crowd_status():
    """Get current crowd status for all locations."""
    try:
        locations = get_all_locations()
        location_data = []
        
        for location in locations:
            location_name = location[1]
            logs = get_logs(location_name)
            
            if logs:
                latest_log = logs[0]
                current_level = latest_log[3]
                go_now = current_level == "low"
                best_time = get_best_time(location_name)
                
                recommendation = ""
                if go_now:
                    recommendation = "✅ Go Now! Crowd is low."
                elif current_level == "medium":
                    recommendation = f"⚠️ Wait. Crowd is medium, best time is {best_time}"
                else:
                    worst_time = get_worst_time(location_name)
                    recommendation = f"🚫 Avoid! Too crowded. Visit after {worst_time}"
                
                location_data.append({
                    "name": location_name,
                    "person_count": latest_log[2],
                    "crowd_level": current_level,
                    "go_now": go_now,
                    "recommendation": recommendation,
                    "best_time": best_time,
                    "timestamp": latest_log[4]
                })
        
        return {"locations": location_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all crowd status: {str(e)}")

@app.get("/status")
async def get_status():
    """Get system status with last update timestamp."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT MAX(timestamp) FROM crowd_logs')
        result = cursor.fetchone()
        conn.close()
        
        last_update = result[0] if result and result[0] else None
        
        return {
            "status": "healthy",
            "last_update": last_update,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")

@app.get("/predict-next-hour/{location}")
async def get_next_hour_predictions(location: str):
    """Get crowd predictions for next hour in 5-minute intervals."""
    try:
        predictions = predict_next_hour(location)
        
        return {
            "location": location,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating next hour predictions: {str(e)}")

@app.post("/retrain")
async def manual_retrain():
    """Manually trigger model retraining."""
    try:
        success = retrain()
        if success:
            return {"message": "Model retrained successfully", "records_used": "Updated with latest data"}
        else:
            return {"message": "Model retraining failed - insufficient data", "records_used": "0"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retraining model: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
