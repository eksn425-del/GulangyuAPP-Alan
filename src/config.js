// src/config.js

// 🌟 修复：指向 FastAPI 后端绝对路径，解决 5174 端口代理失败问题
// 本地开发时后端通常在 8000 端口
export const API_URL = "http://localhost:8000"; 

export const API_HEADERS = {
    // 注意：这里不要写 Content-Type，因为上传图片和普通JSON请求需要的头不一样
    "ngrok-skip-browser-warning": "69420"
};
