@echo off
echo Starting Chatbot Server...

REM Step 1: Change to project directory
cd /d %~dp0

REM Step 2: Start the FastAPI server in a new terminal
start cmd /k "python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

REM Step 3: Give the server a second to boot up
timeout /t 10 /nobreak > nul

REM Step 4: Open the chatbot in the default browser
start http://localhost:8000

exit