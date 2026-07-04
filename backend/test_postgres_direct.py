import psycopg2
import os

# Test basic Postgres connection
try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres", 
        password="mallu123",
        database="buildtrack"
    )
    print("✓ Postgres connection successful")
    
    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    print(f"✓ Query executed successfully: {result}")
    
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    tables = cur.fetchall()
    print(f"✓ Tables found: {[t[0] for t in tables]}")
    
    cur.close()
    conn.close()
    print("✓ Connection closed successfully")
    
except Exception as e:
    print(f"✗ Database connection failed: {e}")
