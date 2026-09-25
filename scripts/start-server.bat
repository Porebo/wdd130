@echo off
rem Starts the local web server and opens the site in the browser.
rem Close this window to stop the server.
start "" http://localhost:8000/
python "%~dp0serve.py"
pause
