from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .services.socketio_server import init_socket

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/health')
def health():
    return {'status': 'ok'}

# Mount other routers here

from .routes.families import router as families_router
from .routes.parents import router as parents_router
from .routes.children import router as children_router
from .routes.subscriptions import router as subscriptions_router
from .routes.payments import router as payments_router
from .routes.notifications import router as notifications_router
from .routes.auth import router as auth_router
from .routes.dashboards import router as dashboards_router
from .routes.builders import router as builders_router
from .routes.workspaces import router as workspaces_router
from .routes.escrow import router as escrow_router
from .routes.files import router as files_router
from .routes.reviews import router as reviews_router
from .routes.analytics import router as analytics_router

app.include_router(auth_router)
app.include_router(families_router)
app.include_router(parents_router)
app.include_router(children_router)
app.include_router(subscriptions_router)
app.include_router(payments_router)
app.include_router(notifications_router)
app.include_router(dashboards_router)
app.include_router(builders_router)
app.include_router(workspaces_router)
app.include_router(escrow_router)
app.include_router(files_router)
app.include_router(reviews_router)
app.include_router(analytics_router)

init_socket(app)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
