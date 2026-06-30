@echo off
cd /d "%~dp0"
echo Starting CineScope Magazine at http://localhost:3000
node_modules\.bin\next.CMD dev -p 3000
