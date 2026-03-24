@echo off
echo 正在启动鼓浪屿后端服务器...
cd backend
call venv\Scripts\activate
uvicorn main:app --reload
pause