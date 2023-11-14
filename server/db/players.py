import sqlite3

# Connect to the database (or create it if it doesn't exist)
conn = sqlite3.connect('game.db')

# Create a cursor object using the cursor method
cursor = conn.cursor()

# SQL statement to create a table
create_table_query = """
CREATE TABLE IF NOT EXISTS players (
    player_id TEXT PRIMARY KEY,
    position_x INTEGER,
    position_y INTEGER,
    health INTEGER,
    max_health INTEGER,
    experience INTEGER,
    level INTEGER,
    inventory TEXT
);
"""

# Execute the SQL command
cursor.execute(create_table_query)

# Commit the changes
conn.commit()

# Close the database connection
conn.close()