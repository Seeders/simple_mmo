
import sqlite3

# Connect to the database (or create it if it doesn't exist)
conn = sqlite3.connect('game.db')

# Create a cursor object using the cursor method
cursor = conn.cursor()
cursor.execute("DROP TABLE IF EXISTS user_credentials;")

# SQL statement to create a table
create_table_query = """
CREATE TABLE IF NOT EXISTS user_credentials (
    username TEXT PRIMARY KEY,
    password_hash TEXT,
    player_id TEXT,
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);
"""

# Execute the SQL command
cursor.execute(create_table_query)

# Commit the changes
conn.commit()

# Close the database connection
conn.close()
