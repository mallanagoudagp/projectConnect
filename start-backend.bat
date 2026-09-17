@echo off
title BuildTrack Backend
cd /d "C:\Users\malla\OneDrive\build-track-app-design (1)\backend"
echo Starting BuildTrack backend on http://localhost:8000 ...
python -m uvicorn app.main:app --reload --port 8000
pause
