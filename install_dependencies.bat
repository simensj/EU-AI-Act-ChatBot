@echo off
echo Installing chatbot dependencies...
cd /d %~dp0

pip install -r requirements.txt

echo.
echo All dependencies installed. You can now launch the chatbot!
pause