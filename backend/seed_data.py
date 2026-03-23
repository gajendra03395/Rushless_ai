import sqlite3
import random
from datetime import datetime, timedelta
from database import init_db, log_crowd
from model import retrain, get_crowd_level

# Location patterns per hour (7AM to 8PM)
LOCATION_PATTERNS = {
    'Cafeteria': [8, 18, 22, 25, 28, 55, 58, 50, 20, 15, 12, 10, 8, 5],
    'Canteen': [5, 10, 15, 22, 30, 35, 52, 48, 25, 15, 12, 10, 8, 5],
    'Library': [5, 15, 35, 38, 32, 20, 18, 15, 20, 32, 35, 28, 15, 8],
    'Gym': [40, 38, 20, 12, 10, 8, 5, 5, 8, 12, 18, 38, 42, 30],
    'Xerox Center': [5, 12, 30, 35, 32, 20, 15, 12, 10, 8, 5, 3, 2, 1]
}

def generate_seed_data():
    """Generate realistic crowd data for last 7 days."""
    print("🔄 Clearing existing crowd logs...")
    conn = sqlite3.connect('campus_crowd.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM crowd_logs')
    conn.commit()
    conn.close()
    
    print("📊 Generating seed data for last 7 days...")
    
    # Generate data for last 7 days
    base_date = datetime.now() - timedelta(days=7)
    hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    
    total_entries = 0
    location_counts = {}
    
    for day in range(7):
        current_date = base_date + timedelta(days=day)
        is_weekend = current_date.weekday() >= 5  # Saturday or Sunday
        
        for hour_idx, hour in enumerate(hours):
            for location, pattern in LOCATION_PATTERNS.items():
                # Get base count for this hour
                base_count = pattern[hour_idx]
                
                # Add random noise
                count = base_count + random.randint(-3, 3)
                count = max(0, count)  # Ensure non-negative
                
                # Apply weekend multiplier
                if is_weekend:
                    count = int(count * 0.4)
                
                # Get crowd level
                crowd_level = get_crowd_level(count)
                
                # Create timestamp
                timestamp = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                
                # Log to database
                log_crowd(location, count, crowd_level, timestamp)
                
                # Track counts
                location_counts[location] = location_counts.get(location, 0) + 1
                total_entries += 1
    
    print(f"✅ Generated {total_entries} total entries:")
    for location, count in location_counts.items():
        print(f"   {location}: {count} entries")
    
    # Retrain model with new data
    print("🤖 Retraining model with seed data...")
    retrain()
    
    print("🎉 Seed data generation complete!")

if __name__ == "__main__":
    init_db()
    generate_seed_data()
