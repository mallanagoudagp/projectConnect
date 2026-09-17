from app.services.db import engine
from sqlalchemy import text
conn = engine.connect()

print('Deleting related Approvals...')
conn.execute(text("DELETE FROM approvals WHERE parent_id = 1"))

print('Deleting related Sessions...')
conn.execute(text("DELETE FROM sessions WHERE project_request_id IN (SELECT id FROM project_requests WHERE child_id = 1 OR service_id IN (SELECT id FROM services WHERE builder_id = 1))"))

print('Deleting related Escrow Payments...')
conn.execute(text("DELETE FROM escrow_payments WHERE project_request_id IN (SELECT id FROM project_requests WHERE child_id = 1 OR service_id IN (SELECT id FROM services WHERE builder_id = 1))"))

print('Deleting related File Attachments...')
conn.execute(text("DELETE FROM file_attachments WHERE project_request_id IN (SELECT id FROM project_requests WHERE child_id = 1 OR service_id IN (SELECT id FROM services WHERE builder_id = 1))"))

print('Deleting related Reviews...')
conn.execute(text("DELETE FROM reviews WHERE project_request_id IN (SELECT id FROM project_requests WHERE child_id = 1 OR service_id IN (SELECT id FROM services WHERE builder_id = 1))"))


print('Deleting related Project Requests...')
conn.execute(text("DELETE FROM project_requests WHERE child_id = 1 OR service_id IN (SELECT id FROM services WHERE builder_id = 1)"))

print('Deleting Demo Services...')
conn.execute(text("DELETE FROM services WHERE builder_id = 1"))

print('Deleting Notifications...')
conn.execute(text("DELETE FROM notifications WHERE recipient_email IN ('parent@demo.com', 'builder@demo.com', 'student@demo.com')"))

print('Deleting Demo Parent...')
conn.execute(text("DELETE FROM parents WHERE email = 'parent@demo.com'"))

print('Deleting Demo Builder...')
conn.execute(text("DELETE FROM builders WHERE email = 'builder@demo.com'"))

print('Deleting Demo Student...')
conn.execute(text("DELETE FROM children WHERE name = 'Demo Student'"))

conn.commit()
print('Demo accounts successfully removed.')
conn.close()
