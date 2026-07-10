# 🎯 Interview Pro AI

An AI-powered multimodal interview platform that generates personalized interview questions, conducts AI-based interviews, analyzes candidate performance using speech, facial expressions, eye contact, and attention tracking, and produces a comprehensive interview report.

---

# 🚀 Features

## 🤖 AI Interview Generation

* Resume-based interview questions
* Role-specific interview generation
* Difficulty selection (Easy / Medium / Hard)
* Powered by Google Gemini (Frontend - Lovable)

---

## 📄 Resume Parsing

* Upload PDF Resume
* Automatic resume parsing
* Extracts:

  * Skills
  * Education
  * Experience
  * Projects
* Personalized interview generation

---

## 🎤 Speech Recognition

* OpenAI Whisper
* Converts candidate speech into text
* High accuracy speech-to-text

Backend API

```
POST /speech/transcribe
```

---

## 😊 Emotion Detection

Uses DeepFace to detect

* Happy
* Sad
* Angry
* Neutral
* Fear
* Surprise
* Disgust

Backend API

```
POST /emotion/detect
```

---

## 👀 Eye Contact Detection

Real-time eye contact monitoring using OpenCV.

Detects

* Looking at camera
* Looking away

Backend API

```
POST /analysis/analyze
```

---

## 🎯 Attention Monitoring

Calculates

* Attention score
* Focus status
* Candidate engagement

Backend API

```
POST /monitor/live
```

---

## 📊 AI Analytics Dashboard

Displays

* Emotion
* Eye Contact
* Attention Score
* Focus Status
* Overall Performance

---

## 📑 Interview Reports

Generates

* Performance Score
* Strengths
* Weaknesses
* Suggestions
* PDF Report

---

## ☁ Database

Supabase

Stores

* Interview History
* Candidate Reports
* Analytics

---

# 🏗 Architecture

```
                +----------------------+
                |       Frontend       |
                +----------+-----------+
                           |
             Resume Upload / Interview
                           |
                           |
          Google Gemini (Frontend Only)
                           |
                           |
        -------------------------------
        |             |               |
        |             |               |
        ▼             ▼               ▼
 Speech API     Emotion API     Analysis API
  Whisper        DeepFace        OpenCV
        |             |               |
        -------------------------------
                     |
                     ▼
             FastAPI Backend
                     |
                     ▼
                Supabase Database
                     |
                     ▼
              Dashboard + Reports
```

---

# 🛠 Tech Stack

## Frontend

* React
* TypeScript
* Tailwind CSS
* Google Gemini API

---

## Backend

* FastAPI
* Python

---

## AI Models

* Google Gemini
* OpenAI Whisper
* DeepFace
* OpenCV

---

## Database

* Supabase

---

# 📂 Project Structure

```
backend/

app/
│
├── main.py
│
├── routes/
│   ├── interview.py
│   ├── resume.py
│   ├── speech.py
│   ├── emotion.py
│   ├── analysis.py
│   ├── monitor.py
│   ├── evaluation.py
│   └── report.py
│
├── services/
│   ├── whisper_service.py
│   ├── emotion_service.py
│   ├── analysis_service.py
│   └── report_service.py
│
├── uploads/
│
└── requirements.txt
```

---

# ⚙ Installation

## Clone

```bash
git clone <repository-url>
```

---

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate
```

Windows

```bash
.venv\Scripts\activate
```

---

Install dependencies

```bash
pip install -r requirements.txt
```

---

Run FastAPI

```bash
uvicorn app.main:app --reload
```

Server

```
http://127.0.0.1:8000
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

# 🔌 Backend APIs

Resume

```
POST /resume/upload
```

Interview

```
POST /interview/start
```

Speech

```
POST /speech/transcribe
```

Emotion

```
POST /emotion/detect
```

Attention

```
POST /analysis/analyze
```

Monitoring

```
POST /monitor/live
```

Evaluation

```
POST /evaluation/evaluate
```

Report

```
POST /report/generate
```

---

# 📦 Main Libraries

```
fastapi
uvicorn
openai-whisper
opencv-python
deepface
tensorflow
tf-keras
python-multipart
pydantic
supabase
python-dotenv
```

---

# 🔮 Future Enhancements

* Live AI interviewer
* AI voice interaction (Text-to-Speech)
* Real-time interview coaching
* Gesture detection
* Body posture analysis
* Lip-sync detection
* Anti-cheating detection
* HR analytics dashboard
* Interview replay
* Multi-language interviews

---

# 📄 License

This project is developed for academic and educational purposes.
