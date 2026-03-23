import sqlite3
import os
from datetime import datetime

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_crowd.db')

def init_db():
    """Initialize the database with required tables and default locations."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create locations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT
        )
    ''')
    
    # Create crowd_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crowd_logs (
            id INTEGER PRIMARY KEY,
            location TEXT NOT NULL,
            person_count INTEGER NOT NULL,
            crowd_level TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location) REFERENCES locations(name)
        )
    ''')
    
    # Insert default locations if they don't exist
    default_locations = [
        ('Cafeteria', 'Main campus cafeteria serving meals and snacks'),
        ('Canteen', 'Alternative dining option with quick service'),
        ('Library', 'Main library building with study spaces'),
        ('Gym', 'Campus fitness center and sports facilities'),
        ('Xerox Center', 'Printing and photocopying services')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO locations (name, description) 
        VALUES (?, ?)
    ''', default_locations)
    
    conn.commit()
    conn.close()

def log_crowd(location, person_count, crowd_level):
    """Log crowd data for a specific location."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO crowd_logs (location, person_count, crowd_level)
        VALUES (?, ?, ?)
    ''', (location, person_count, crowd_level))
    
    conn.commit()
    conn.close()

def get_logs(location=None):
    """Retrieve crowd logs, optionally filtered by location."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if location:
        cursor.execute('''
            SELECT * FROM crowd_logs 
            WHERE location = ? 
            ORDER BY timestamp DESC
        ''', (location,))
    else:
        cursor.execute('''
            SELECT * FROM crowd_logs 
            ORDER BY timestamp DESC
        ''')
    
    logs = cursor.fetchall()
    conn.close()
    return logs

def get_all_locations():
    """Get all available locations."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM locations ORDER BY name')
    locations = cursor.fetchall()
    conn.close()
    return locations

def get_recent_logs(location, limit=50):
    """Get recent logs for a location, ordered by timestamp DESC."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM crowd_logs 
        WHERE location = ? 
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (location, limit))
    
    logs = cursor.fetchall()
    conn.close()
    return logs
