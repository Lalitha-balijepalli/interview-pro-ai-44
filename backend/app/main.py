from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import emotion
from app.routes import speech
from app.routes.resume import router as resume_router
from app.routes.interview import router as interview_router
from app.routes.evaluation import router as evaluation_router
from app.routes.report import router as report_router
from app.routes import analysis
from app.routes import monitor
from app.routes import scoring


app = FastAPI(title="Interview Pro AI Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",   # For development only
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Speech
app.include_router(
    speech.router,
    prefix="/speech",
    tags=["Speech"]
)

# Resume
app.include_router(
    resume_router,
    prefix="/resume",
    tags=["Resume"]
)

# Interview
app.include_router(
    interview_router,
    prefix="/interview",
    tags=["Interview"]
)

# Evaluation
app.include_router(
    evaluation_router,
    prefix="/evaluation",
    tags=["Evaluation"]
)

# Report
app.include_router(
    report_router,
    prefix="/report",
    tags=["Report"]
)

app.include_router(
    emotion.router,
    prefix="/emotion",
    tags=["Emotion Detection"]
)

app.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["Analysis"]
)

app.include_router(
    monitor.router,
    prefix="/monitor",
    tags=["Live Monitoring"]
)

app.include_router(
    scoring.router,
    prefix="/scoring",
    tags=["Scoring"]
)

@app.get("/")
def health_check():
    return {"status": "ok"}