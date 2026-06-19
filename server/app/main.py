from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.limiter import limiter
from app.core.config import settings
import app.models  # noqa: F401

from app.api.v1 import ai, auth, cases, categories, favourites, files, leads, lessons, notifications, posts, stages, training, universities, users
from app.api.v1.admin import dashboard, notifications as admin_notifications, reminders, activity_log
from app.services.file_service import init_buckets
from app.tasks.deadline_checker import check_deadlines

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Migrations are run by entrypoint.sh before uvicorn starts
    try:
        init_buckets()
    except Exception:
        pass
    scheduler.add_job(check_deadlines, "cron", hour=8, minute=0, id="deadline_checker")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="EduBridge University API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(leads.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(universities.router, prefix=PREFIX)
app.include_router(stages.router, prefix=PREFIX)
app.include_router(favourites.router, prefix=PREFIX)
app.include_router(training.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(lessons.router, prefix=PREFIX)
app.include_router(cases.router, prefix=PREFIX)
app.include_router(files.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(admin_notifications.router, prefix=PREFIX)
app.include_router(reminders.router, prefix=PREFIX)
app.include_router(activity_log.router, prefix=PREFIX)
app.include_router(ai.router, prefix=PREFIX)
app.include_router(posts.router, prefix=PREFIX)
app.include_router(categories.router, prefix=PREFIX)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "Server is running",
        "version": "2.0.2",
        }
