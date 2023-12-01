import sqlite3

# Connect to the database (or create it if it doesn't exist)
conn = sqlite3.connect('game.db')
cursor = conn.cursor()

# Step 3: Drop the old table
cursor.execute("DROP TABLE IF EXISTS players;")
# Step 1: Create a new table with the desired schema
cursor.execute("""
CREATE TABLE IF NOT EXISTS players (
    player_id TEXT PRIMARY KEY,
    world_x INTEGER,
    world_y INTEGER,
    position_x INTEGER,
    position_y INTEGER,
    stats TEXT,
    inventory TEXT
);
""")

# Commit the changes and close the connection
conn.commit()
conn.close()
