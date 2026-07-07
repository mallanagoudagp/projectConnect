from app.services.db import engine
from sqlalchemy import text

conn = engine.connect()
r = conn.execute(text("UPDATE builders SET verification_status='verified' WHERE verification_status != 'verified'"))
conn.commit()
print(f"Verified {r.rowcount} builder(s)")

# Show all builders now
rows = conn.execute(text("SELECT id, name, email, verification_status FROM builders")).fetchall()
for row in rows:
    print(f"  Builder: id={row[0]} name={row[1]} email={row[2]} status={row[3]}")
conn.close()
