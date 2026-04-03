import os
import sqlite3  
import json
import logging
import time
import http.client
import base64
import difflib
import re
import pypinyin
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.responses import FileResponse, JSONResponse 
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from openai import OpenAI
from database import get_db_connection, init_db, get_db, init_sqlalchemy, HazardLog, ABTestSummary
from analysis import get_analytics_data, get_phase4_ab_report
from graph_engine import route_engine

# 尝试加载环境变量（如果安装了python-dotenv）
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # 如果没有安装dotenv，跳过

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
init_sqlalchemy()
init_db()

# 1. 解决跨域问题 (CORS) - 允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- 👇 AI 配置 👇 ---
# 从环境变量获取 API Key，如果没有则使用默认值（仅用于开发测试）
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-722cd77b08814d06acb47febdc37d373")

if not DASHSCOPE_API_KEY or DASHSCOPE_API_KEY == "":
    raise ValueError("请设置环境变量 DASHSCOPE_API_KEY，或在 .env 文件中配置")

# 初始化客户端
client = OpenAI(
    api_key=DASHSCOPE_API_KEY, 
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

def get_pinyin(text_str):
    if not text_str:
        return ""
    return "".join(pypinyin.lazy_pinyin(text_str, style=pypinyin.Style.NORMAL))

def fuzzy_substring_match(query, text, threshold=0.7):
    if not query or not text:
        return -1
    if query in text:
        return text.find(query)
    query_py = get_pinyin(query)
    text_py = get_pinyin(text)
    if query_py in text_py:
        return text_py.find(query_py)
    q_len = len(query)
    t_len = len(text)
    if q_len > t_len:
        if difflib.SequenceMatcher(None, query_py, text_py).ratio() >= threshold:
            return 0
        return -1
    best_ratio = 0
    best_idx = -1
    for i in range(t_len - q_len + 1):
        window_text = text[i:i+q_len]
        ratio_char = difflib.SequenceMatcher(None, query, window_text).ratio()
        window_py = get_pinyin(window_text)
        ratio_py = difflib.SequenceMatcher(None, query_py, window_py).ratio()
        ratio = max(ratio_char, ratio_py)
        if ratio > best_ratio:
            best_ratio = ratio
            best_idx = i
    if best_ratio >= threshold:
        return best_idx
    return -1

def fuzzy_substring_details(query, text):
    if not query or not text:
        return -1, 0.0
    if query in text:
        return text.find(query), 1.0
    query_py = get_pinyin(query)
    text_py = get_pinyin(text)
    if query_py in text_py:
        return text_py.find(query_py), 0.98
    q_len = len(query)
    t_len = len(text)
    if q_len > t_len:
        ratio = difflib.SequenceMatcher(None, query_py, text_py).ratio()
        if ratio > 0:
            return 0, ratio
        return -1, 0.0
    best_ratio = 0.0
    best_idx = -1
    for i in range(t_len - q_len + 1):
        window_text = text[i:i + q_len]
        ratio_char = difflib.SequenceMatcher(None, query, window_text).ratio()
        window_py = get_pinyin(window_text)
        ratio_py = difflib.SequenceMatcher(None, query_py, window_py).ratio()
        ratio = max(ratio_char, ratio_py)
        if ratio > best_ratio:
            best_ratio = ratio
            best_idx = i
    return best_idx, best_ratio

PLACE_ALIASES = {
    "李传别宅": ["李传别", "李传宅", "理传别宅", "李船别宅", "里传别宅", "理传别", "李船", "里传", "李传"],
    "海天堂构": ["海天团购", "海天堂", "海天构", "海天", "海甜", "海田", "海田烫够"],
    "黄荣远堂": ["黄蓉远塘", "黄荣远", "黄蓉远", "黄榕远", "黄蓉", "皇荣远"],
    "许家园": ["许佳园", "徐家园", "许家院", "徐佳园", "徐家", "许园"],
    "协和礼拜堂": ["鞋盒礼拜堂", "协和教堂", "礼拜堂", "鞋盒", "协和", "携河"],
    "天主教堂": ["天主堂", "天主教", "甜竹"],
    "仰高别墅": ["羊羔别墅", "洋高别墅", "杨高别墅", "羊羔", "仰高", "杨高"]
}

PLACE_PINYIN = {
    "李传别宅": "lichuanbiezhai",
    "海天堂构": "haitiantanggou",
    "黄荣远堂": "huangrongyuantang",
    "许家园": "xujiayuan",
    "协和礼拜堂": "xiehelibaitang",
    "天主教堂": "tianzhujiaotang",
    "仰高别墅": "yanggaobieshu"
}

PLACE_PINYIN_PREFIX = {
    "李传别宅": "lichuan",
    "海天堂构": "haitian",
    "黄荣远堂": "huangrong",
    "许家园": "xujia",
    "协和礼拜堂": "xiehe",
    "天主教堂": "tianzhu",
    "仰高别墅": "yanggao"
}

NAV_INTENT_KEYWORDS = [
    "从", "到", "去", "前往", "怎么走", "怎么去", "路线", "导航", "带我去", "到达", "走到", "出发"
]

SHORT_ALIAS_PINYIN_LEN = 6


def has_navigation_intent(user_msg):
    text = (user_msg or "").strip().lower()
    if not text:
        return False
    return any(k in text for k in NAV_INTENT_KEYWORDS)


def adaptive_match_threshold(short_name, asr_confidence=None):
    name_len = len(short_name or "")
    threshold = 0.78
    if name_len <= 2:
        threshold = 0.9
    elif name_len == 3:
        threshold = 0.84
    if asr_confidence is not None:
        if asr_confidence < 0.35:
            threshold += 0.04
        elif asr_confidence < 0.5:
            threshold += 0.02
    return min(0.95, threshold)


def get_place_prefix(short_name):
    if not short_name:
        return ""
    syllables = pypinyin.lazy_pinyin(short_name, style=pypinyin.Style.NORMAL)
    if not syllables:
        return ""
    return "".join(syllables[:2])


def _dedupe_keep_order(items):
    seen = set()
    result = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _is_short_alias(alias):
    alias_py = get_pinyin(alias)
    return len(alias or "") <= 2 or len(alias_py) <= SHORT_ALIAS_PINYIN_LEN


def _keep_match_char(ch):
    return ch.isalnum() or ("\u4e00" <= ch <= "\u9fff")


def compact_text_with_map(text):
    compact_chars = []
    index_map = []
    for idx, ch in enumerate(text or ""):
        if _keep_match_char(ch):
            compact_chars.append(ch.lower())
            index_map.append(idx)
    return "".join(compact_chars), index_map


def pinyin_offset_to_compact_index(text, pinyin_offset):
    if pinyin_offset <= 0:
        return 0
    consumed = 0
    for idx, ch in enumerate(text):
        consumed += len(get_pinyin(ch))
        if consumed > pinyin_offset:
            return idx
    return max(0, len(text) - 1)


def _best_pinyin_window_score(query_py, text_py):
    if not query_py or not text_py:
        return -1, 0.0
    if query_py in text_py:
        return text_py.find(query_py), 1.0
    q_len = len(query_py)
    t_len = len(text_py)
    min_size = max(1, q_len - 4)
    max_size = min(t_len, q_len + 4)
    best_idx = -1
    best_score = 0.0
    for size in range(min_size, max_size + 1):
        for i in range(0, t_len - size + 1):
            ratio = difflib.SequenceMatcher(None, query_py, text_py[i:i + size]).ratio()
            if ratio > best_score:
                best_score = ratio
                best_idx = i
    return best_idx, best_score


def match_place_in_text(short_name, user_msg, aliases=None, canonical_pinyin="", pinyin_prefix="", navigation_intent=False, asr_confidence=None):
    aliases = aliases or []
    user_msg = user_msg or ""
    if not short_name or not user_msg:
        return {"idx": -1, "score": 0.0, "method": "none", "matched_text": ""}

    compact_msg, msg_map = compact_text_with_map(user_msg)
    if not compact_msg:
        return {"idx": -1, "score": 0.0, "method": "none", "matched_text": ""}

    compact_short, _ = compact_text_with_map(short_name)
    if compact_short and compact_short in compact_msg:
        compact_idx = compact_msg.find(compact_short)
        return {"idx": msg_map[compact_idx], "score": 1.0, "method": "exact", "matched_text": short_name}

    sorted_aliases = sorted(aliases, key=len, reverse=True)
    for alias in sorted_aliases:
        if _is_short_alias(alias) and not navigation_intent:
            continue
        compact_alias, _ = compact_text_with_map(alias)
        if compact_alias and compact_alias in compact_msg:
            compact_idx = compact_msg.find(compact_alias)
            score = 0.985 if len(alias) >= 3 else 0.9
            return {"idx": msg_map[compact_idx], "score": score, "method": "alias", "matched_text": alias}

    compact_msg_py = get_pinyin(compact_msg)
    compact_msg_ascii = re.sub(r"[^a-z0-9]", "", compact_msg.lower())
    threshold = adaptive_match_threshold(short_name, asr_confidence)
    pinyin_candidates = [get_pinyin(short_name), canonical_pinyin]
    pinyin_candidates.extend([get_pinyin(alias) for alias in sorted_aliases])
    pinyin_candidates = _dedupe_keep_order(pinyin_candidates)
    for p in pinyin_candidates:
        if not p:
            continue
        if len(p) <= SHORT_ALIAS_PINYIN_LEN and not navigation_intent:
            continue
        if p in compact_msg_py:
            py_idx = compact_msg_py.find(p)
            compact_idx = pinyin_offset_to_compact_index(compact_msg, py_idx)
            return {"idx": msg_map[compact_idx], "score": 0.95, "method": "pinyin", "matched_text": p}
        if p in compact_msg_ascii:
            ascii_idx = compact_msg_ascii.find(p)
            return {"idx": msg_map[ascii_idx], "score": 0.95, "method": "pinyin_ascii", "matched_text": p}
        py_idx, py_score = _best_pinyin_window_score(p, compact_msg_py)
        if py_score >= max(0.9, threshold + 0.05):
            compact_idx = pinyin_offset_to_compact_index(compact_msg, py_idx)
            return {"idx": msg_map[compact_idx], "score": round(py_score, 4), "method": "pinyin_fuzzy", "matched_text": p}

    if pinyin_prefix and len(pinyin_prefix) > SHORT_ALIAS_PINYIN_LEN:
        if pinyin_prefix in compact_msg_py:
            py_idx = compact_msg_py.find(pinyin_prefix)
            compact_idx = pinyin_offset_to_compact_index(compact_msg, py_idx)
            return {"idx": msg_map[compact_idx], "score": 0.84, "method": "prefix", "matched_text": pinyin_prefix}

    idx, score = fuzzy_substring_details(compact_short or short_name, compact_msg)
    if idx != -1 and score >= threshold:
        mapped_idx = msg_map[min(idx, len(msg_map) - 1)]
        return {"idx": mapped_idx, "score": score, "method": "fuzzy", "matched_text": short_name}
    return {"idx": -1, "score": 0.0, "method": "none", "matched_text": ""}


def match_place_index(short_name, user_msg):
    result = match_place_in_text(
        short_name=short_name,
        user_msg=user_msg,
        aliases=PLACE_ALIASES.get(short_name, []),
        canonical_pinyin=PLACE_PINYIN.get(short_name, ""),
        pinyin_prefix=PLACE_PINYIN_PREFIX.get(short_name, ""),
        navigation_intent=has_navigation_intent(user_msg),
        asr_confidence=None
    )
    return result["idx"], result["score"]


def infer_start_end_from_semantics(mentioned_nodes, user_msg):
    if len(mentioned_nodes) == 0:
        return None, None
    sorted_nodes = sorted(mentioned_nodes, key=lambda x: x["idx"])
    if len(sorted_nodes) == 1:
        return None, sorted_nodes[0]["node"]
    msg = user_msg or ""
    from_markers = ["从", "由", "自", "出发"]
    to_markers = ["到", "去", "前往", "往", "导航到", "带我去"]
    from_positions = [msg.find(m) for m in from_markers if m in msg]
    to_positions = [msg.find(m) for m in to_markers if m in msg]
    from_pos = min(from_positions) if from_positions else -1
    to_pos = min(to_positions) if to_positions else -1

    start_candidate = None
    end_candidate = None

    if from_pos != -1:
        after_from = [m for m in sorted_nodes if m["idx"] >= from_pos]
        if after_from:
            start_candidate = min(after_from, key=lambda x: x["idx"] - from_pos)

    if to_pos != -1:
        after_to = [m for m in sorted_nodes if m["idx"] >= to_pos]
        if after_to:
            end_candidate = min(after_to, key=lambda x: x["idx"] - to_pos)

    if not start_candidate:
        start_candidate = sorted_nodes[0]
    if not end_candidate:
        end_candidate = sorted_nodes[-1]

    if start_candidate["node"]["node_id"] == end_candidate["node"]["node_id"]:
        unique_nodes = []
        seen_ids = set()
        for node in sorted_nodes:
            node_id = node["node"]["node_id"]
            if node_id in seen_ids:
                continue
            seen_ids.add(node_id)
            unique_nodes.append(node)
        if len(unique_nodes) >= 2:
            start_candidate = unique_nodes[0]
            end_candidate = unique_nodes[-1]
        else:
            return None, None

    return start_candidate["node"], end_candidate["node"]

# 定义 AI 请求格式
class ChatRequest(BaseModel):
    message: str
    user_bearing: float | None = None  # 👈 新增：用户的朝向（陀螺仪）
    strategy: str = "safest"
    asr_confidence: float | None = None
    test_mode: bool = False

# 🔐 定义管理员密码 (为了安全，最好和前端保持一致)
ADMIN_PASSWORD = "8888"


# 3. 配置静态文件服务
# 获取当前 main.py 所在的文件夹路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
# 获取上一级目录（项目根目录）
project_root = os.path.dirname(backend_dir)
# dist 文件夹路径
dist_path = os.path.join(project_root, "dist")
# static 文件夹路径
static_dir = os.path.join(backend_dir, "static")

# 确保文件夹存在
os.makedirs(static_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, "images"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "audio"), exist_ok=True) # 👈 新增：自动创建音频文件夹

# 挂载 /static
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# --- 接口定义 ---

@app.get("/api/health")
def get_health():
    db_connected = False
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        db_connected = True
        conn.close()
    except Exception:
        db_connected = False
    node_count = route_engine.G.number_of_nodes() if hasattr(route_engine, "G") else 0
    graph_loaded = node_count > 0
    return {
        "status": "ok",
        "db_connected": db_connected,
        "node_count": node_count,
        "graph_loaded": graph_loaded
    }

# 接口1：获取所有建筑列表 (改用 SQL 版)
@app.get("/api/buildings")
def get_buildings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buildings")
    rows = cursor.fetchall()
    conn.close()
    # 将 Row 对象转换为字典列表，便于 JSON 序列化
    return [dict(row) for row in rows]

# 接口2：根据ID获取单个建筑详情 (改用 SQL 版)
@app.get("/api/buildings/{building_id}")
def get_building_detail(building_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    # 使用参数化查询防止 SQL 注入
    cursor.execute("SELECT * FROM buildings WHERE id = ?", (building_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        raise HTTPException(status_code=404, detail="建筑未找到")
    # 将 Row 对象转换为字典，便于 JSON 序列化
    return dict(row)
# 接口3：上传图片
@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    # 简单的文件保存逻辑
    file_location = f"static/images/{file.filename}"
    # 确保保存路径是相对于 backend 的
    save_path = os.path.join(backend_dir, file_location)
    
    with open(save_path, "wb+") as file_object:
        file_object.write(file.file.read())
    return {"info": f"file '{file.filename}' saved", "url": f"/static/images/{file.filename}"}

# 接口3.5：上传音频 (新增)
@app.post("/api/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    # 存到 static/audio 文件夹
    file_location = f"static/audio/{file.filename}"
    save_path = os.path.join(backend_dir, file_location)
    
    with open(save_path, "wb+") as file_object:
        file_object.write(file.file.read())
    # 返回 URL 给前端
    return {"info": f"audio '{file.filename}' saved", "url": f"/static/audio/{file.filename}"}

# 接口4：AI 对话接口
@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    request_start_time = time.perf_counter()
    user_msg = request.message.strip()
    print(f"用户问: {user_msg}")

    try:
        # =================================================================
        # 🔥 步骤 1: 获取实时时间信息
        # =================================================================
        current_time = datetime.now()
        time_info = f"当前时间：{current_time.strftime('%Y年%m月%d日 %H:%M')}"

        # =================================================================
        # 🔥 步骤 2: 实时查询数据库 (获取建筑、节点和路径数据)
        # =================================================================
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. 查建筑信息
        cursor.execute("SELECT name, location, history, material, safety_note FROM buildings")
        buildings = cursor.fetchall()
        
        # 2. 查无障碍节点信息
        cursor.execute("SELECT node_id, name, audio_ambient, smell, detail, node_type FROM accessibility_nodes")
        nodes = cursor.fetchall()
        
        conn.close()

        # --- 新增：意图识别与精准寻路 (算法做大脑) ---
        start_node = None
        end_node = None
        mentioned_nodes = []
        route_strategy = (request.strategy or "safest").lower()
        if route_strategy not in {"safest", "shortest"}:
            route_strategy = "safest"

        # 提取用户提到的建筑入口
        entrance_nodes = [n for n in nodes if n['node_type'] == '建筑入口']
        navigation_intent = has_navigation_intent(user_msg)
        
        for n in entrance_nodes:
            short_name = n['name'].replace("入口", "").replace("侧门", "")
            canonical_pinyin = PLACE_PINYIN.get(short_name, get_pinyin(short_name))
            pinyin_prefix = PLACE_PINYIN_PREFIX.get(short_name, get_place_prefix(short_name))
            aliases = PLACE_ALIASES.get(short_name, [])
            match_result = match_place_in_text(
                short_name=short_name,
                user_msg=user_msg,
                aliases=aliases,
                canonical_pinyin=canonical_pinyin,
                pinyin_prefix=pinyin_prefix,
                navigation_intent=navigation_intent,
                asr_confidence=request.asr_confidence
            )
            idx, score = match_result["idx"], match_result["score"]
            threshold = adaptive_match_threshold(short_name, request.asr_confidence)
            if idx != -1 and score >= threshold:
                if not any(item['node']['node_id'] == n['node_id'] for item in mentioned_nodes):
                    mentioned_nodes.append({
                        "idx": idx,
                        "score": round(score, 4),
                        "short_name": short_name,
                        "method": match_result["method"],
                        "node": n
                    })
                
        route_info_text = ""
        if navigation_intent and mentioned_nodes:
            # 语义优先：按“从/到/去”语义判定起终点，避免出现顺序误判
            start_node, end_node = infer_start_end_from_semantics(mentioned_nodes, user_msg)
            
            # 调用底层多路径算法精准寻路，盲人模式默认 user_type="blind"，并传入用户的面朝方向 user_bearing
            if start_node and end_node:
                route_result = route_engine.get_safest_route(
                    start_node['node_id'], 
                    end_node['node_id'], 
                    user_type="blind",
                    user_bearing=request.user_bearing,
                    strategy=route_strategy
                )
                if route_result.get("success") and route_result.get("routes"):
                    route_info_text = f"【系统已为您算出多条安全的路线，请你严格按照以下步骤播报，绝对不要使用东南西北，请用左右转】：\n"
                    
                    # 只取第一条推荐路线，防止 AI 混乱
                    route = route_result['routes'][0]
                    merged_steps = []
                    for i, step in enumerate(route['steps']):
                        dist = step['distance']
                        turn = step.get('turn_instruction', '直行')
                        to_name = step['to_name']
                        
                        if "路口" in to_name:
                            display_name = "一个路口"
                        elif "转角" in to_name:
                            display_name = "一个转角"
                        else:
                            display_name = to_name

                        if i > 0 and turn == "直行" and to_name != route_result['end_name']:
                            merged_steps[-1]['distance'] += dist
                            merged_steps[-1]['to_name'] = display_name
                        else:
                            merged_steps.append({
                                "turn": turn,
                                "distance": dist,
                                "to_name": display_name,
                                "is_endpoint": to_name == route_result['end_name']
                            })
                    
                    step_descriptions = []
                    for i, m in enumerate(merged_steps):
                        if i == 0:
                            if m['turn'] == "出发" or m['turn'] == "直行":
                                action_text = f"从起点出发，直行"
                            else:
                                action_text = f"从起点出发，先{m['turn']}，走"
                                
                            if m['is_endpoint']:
                                desc = f"{action_text}大约{m['distance']:.0f}米，就直接到达{m['to_name']}了。"
                            else:
                                desc = f"{action_text}大约{m['distance']:.0f}米，到达{m['to_name']}。"
                        else:
                            if m['is_endpoint']:
                                desc = f"然后{m['turn']}，走大约{m['distance']:.0f}米，就到达{m['to_name']}了。"
                            else:
                                desc = f"然后{m['turn']}，走大约{m['distance']:.0f}米，到达{m['to_name']}。"
                        step_descriptions.append(desc)
                    
                    route_info_text += "【以下为系统规划的具体路线，请一字不差地念出】\n"
                    route_info_text += "推荐路线：" + " ".join(step_descriptions) + f"\n"
                    route_info_text += f"终点特征（到达时提醒）：{end_node['detail']}\n"
        # --------------------------------

        # 拼接建筑数据
        building_context = "【岛上建筑信息】:\n"
        for b in buildings:
            building_context += f"- {b['name']}({b['location']}): 触感[{b['material']}], 提示[{b['safety_note']}]\n"

        node_context = "【各节点环境特征】:\n"
        for n in nodes:
            node_context += f"- {n['name']}: 环境音[{n['audio_ambient']}], 气味[{n['smell']}]\n"

        intent_context = ""
        if start_node and end_node:
            intent_context = f"\n【系统语音纠错】：用户输入的文本可能包含同音错别字。系统已明确将用户意图解析为：从『{start_node['name']}』出发，前往『{end_node['name']}』。请你务必相信系统的纠错，直接按此路线信息作答，不要说没听清！\n"
        elif end_node:
            intent_context = f"\n【系统语音纠错】：用户输入的文本可能包含同音错别字。系统已明确将用户意图解析为：前往『{end_node['name']}』。请你务必相信系统的纠错，直接按此地名作答，不要说没听清！\n"

        # =================================================================
        # 🔥 步骤 3: 构造 AI 的人设 (动态调整)
        # =================================================================
        if route_info_text:
            action_guideline = """
        【当前任务：播报具体路线】
        系统已经为用户计算出了精准的安全路线，请你严格遵守以下规则：
        1. 必须一字不差地将【推荐路线】完整念出！
        2. 包括所有的路段、距离和转弯！绝对不允许自行总结、合并步骤、遗漏任何一次转弯或擅自改变距离数字！
        3. 必须把路线里的【终点特征】用触觉、听觉的词汇描述给用户听。
        4. 绝对不要使用东南西北，只能用相对方向（左转、右转、直行）。
            """
        elif navigation_intent and start_node and end_node and not route_info_text:
            action_guideline = f"""
        【当前任务：路线规划失败】
        用户想从 {start_node['name']} 到 {end_node['name']}，但系统目前无法计算出这两点之间的有效路线。
        请你向用户致歉，并说明目前可能道路不通，或者建议他们换一个目的地。
            """
        elif navigation_intent and end_node and not start_node:
            action_guideline = f"""
        【当前任务：确认导航起终点】
        用户想去的终点已经识别为（{end_node['name']}），但系统还不知道用户当前从哪里出发。
        请你友善地向用户确认：“您是想去 {end_node['name']} 吗？请问您现在在哪里（或者从哪里出发）呢？”
        不要自己瞎编路线！
            """
        elif navigation_intent and len(mentioned_nodes) == 0:
            action_guideline = """
        【当前任务：提供泛游览建议】
        用户在询问一般的游览路线建议（如：怎么游览最舒适、老人适合走哪条路）。
        请你根据知识库中的【岛上建筑信息】和【各节点环境特征】，为用户推荐几个值得去的景点，并提醒路况（如坡度、台阶、石材）。
        语气要像资深向导，给出合理的游览顺序建议。注意：不需要给出精确的米数和左右转，只需给出大致的方向和特色介绍即可。
            """
        else:
            action_guideline = """
        【当前任务：景点介绍与日常交流】
        用户在询问某个建筑的特色、位置，或者是日常闲聊。
        请根据【岛上建筑信息】回答，突出触觉、听觉、嗅觉等非视觉特征，并注意安全提示。
            """

        system_prompt = f"""
        你是一位在鼓浪屿生活了30年的资深老向导，正在陪同一位视障朋友（或行动不便的老人）游览。
        
        ⏰ **实时信息**：
        {time_info}
        {intent_context}
        
        🔥🔥🔥 **你的知识库** (请严格基于以下数据回答):
        {building_context}
        {node_context}
        {route_info_text}
        🔥🔥🔥

        {action_guideline}

        【绝对禁忌】：
        - 禁止使用"你看"、"映入眼帘"等视觉词。
        - 严禁脑补、瞎编知识库中不存在的精确路线（具体到米和左右转的路线只能由系统提供）。
        - 回复尽量控制在 150 字以内，清晰易懂。
        """

        # =================================================================
        # 🔥 步骤 3: 发送给阿里云
        # =================================================================
        corrected_user_msg = user_msg
        if navigation_intent and start_node and end_node:
            corrected_user_msg += f"\n\n(系统强制指令：系统已将错别字纠正，用户真实意图是从【{start_node['name']}】到【{end_node['name']}】。请直接以此为你导航，绝对不要说没听清！)"
        elif end_node:
            corrected_user_msg += f"\n\n(系统强制指令：系统已将错别字纠正，用户真实意图是去【{end_node['name']}】。请直接以此回答，绝对不要说没听清！)"

        if request.test_mode:
            ai_reply = "[TEST_MODE] 算法层执行完毕，已跳过LLM调用。"
        else:
            response = client.chat.completions.create(
                model="qwen-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": corrected_user_msg}
                ]
            )
            ai_reply = response.choices[0].message.content
        latency_ms = round((time.perf_counter() - request_start_time) * 1000, 2)
        debug_info = {
            "recognized_places": [
                {
                    "place_name": item["short_name"],
                    "node_id": item["node"]["node_id"],
                    "score": item["score"],
                    "method": item.get("method"),
                    "position": item["idx"]
                }
                for item in sorted(mentioned_nodes, key=lambda x: x["idx"])
            ],
            "matched_start_place": start_node["name"] if start_node else None,
            "matched_end_place": end_node["name"] if end_node else None,
            "matched_start_score": next((item["score"] for item in mentioned_nodes if start_node and item["node"]["node_id"] == start_node["node_id"]), None),
            "matched_end_score": next((item["score"] for item in mentioned_nodes if end_node and item["node"]["node_id"] == end_node["node_id"]), None),
            "asr_confidence": request.asr_confidence,
            "navigation_intent": navigation_intent,
            "strategy": route_strategy,
            "latency_ms": latency_ms,
            "test_mode": request.test_mode,
            "match_method": next((item.get("method") for item in mentioned_nodes), None)
        }
        return {"reply": ai_reply, "debug_info": debug_info}

    except Exception as e:
        print(f"AI 出错了: {e}")
        latency_ms = round((time.perf_counter() - request_start_time) * 1000, 2)
        return {
            "reply": "抱歉，导游信号好像断了，请您再说一遍？",
            "debug_info": {
                "recognized_places": [],
                "matched_start_place": None,
                "matched_end_place": None,
                "matched_start_score": None,
                "matched_end_score": None,
                "strategy": (request.strategy or "safest").lower(),
                "latency_ms": latency_ms,
                "test_mode": request.test_mode,
                "match_method": next((item.get("method") for item in mentioned_nodes), None),
                "error": str(e)
            }
        }
# 接口5：视觉识别接口 (The Eye)
@app.post("/api/vision")
async def analyze_image(file: UploadFile = File(...)):
    print(f"收到图片: {file.filename}")
    
    try:
        # 1. 读取图片并转为 Base64
        file_content = await file.read()
        base64_image = base64.b64encode(file_content).decode('utf-8')

        # 2. 构造 Vision Prompt
        system_prompt = """
        你是一个辅助视障人士（盲人）的智能导游助手。
        请描述这张图片中的建筑或场景。
        要求：
        1. **安全优先**：先说有没有障碍物（台阶、柱子、路障）。
        2. **建筑特征**：用触觉词汇描述（如"红砖粗糙"、"石柱冰凉"）。
        3. **简洁**：控制在 80 字以内，语气亲切。
        """

        # 3. 调用阿里云视觉模型 (qwen-vl-max)
        response = client.chat.completions.create(
            model="qwen-vl-max", # 👈 视觉专用模型
            messages=[
               {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": system_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        },
                   ],
                }
            ],
        )

        ai_reply = response.choices[0].message.content
        return {"reply": ai_reply}

    except Exception as e:
        print(f"视觉识别出错: {e}")
        return {"reply": "抱歉，我看不太清，请您离近一点或换个角度再拍一张。"}

# 接口6：数据分析接口 (需要管理员密码)
@app.get("/api/stats")
def get_stats(x_admin_password: str = Header(..., alias="x-admin-password")):
    """
    获取数据分析统计
    需要管理员密码验证
    """
    # 🔒 检查密码
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，您没有权限查看统计数据！")
    
    try:
        # 调用分析函数
        result = get_analytics_data()
        
        # 如果有错误，返回错误信息
        if "error" in result:
            return JSONResponse(
                status_code=500,
                content={"error": result["error"], "data": result}
            )
        
        return result
    except Exception as e:
        print(f"统计数据获取出错: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计数据失败: {str(e)}")

@app.get("/api/phase4_report")
def get_phase4_report(x_admin_password: str = Header(..., alias="x-admin-password")):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，您没有权限查看阶段四报告！")
    result = get_phase4_ab_report()
    if "error" in result:
        return JSONResponse(status_code=500, content=result)
    return result

# 接口7：安全路径规划接口 (基于多路径算法)
@app.get("/api/route")
def get_safest_route(start: str, end: str, user_type: str = "normal", user_bearing: float = None, max_routes: int = 3, strategy: str = "safest"):
    """
    计算两点之间的最安全路径
    start: 起点名称 (如 '轮渡码头入口')
    end: 终点名称 (如 '音乐厅')
    """
    result = route_engine.get_safest_route(
        start_node_id=start,
        end_node_id=end,
        user_type=user_type,
        user_bearing=user_bearing,
        max_routes=max_routes,
        strategy=strategy
    )
    
    if "error" in result and not result.get("success"):
        # 如果是路径找不到，返回 404
        if "无路可走" in result["error"]:
             raise HTTPException(status_code=404, detail=result["error"])
        # 如果是节点不存在，返回 400
        elif "节点不存在" in result["error"]:
             raise HTTPException(status_code=400, detail=result)
        else:
             raise HTTPException(status_code=500, detail=result["error"])
             
    return result

# --------------------------------------------------------------------------------
# 🆕 迁移后的事故日志接口 (替代原 CSV 写入)
# --------------------------------------------------------------------------------

class HazardRecord(BaseModel):
    timestamp: datetime | None = None
    hazard_type: str | None = None
    obstacle_type: str | None = None # 👈 兼容 Unity 发来的字段名
    x: float
    y: float
    z: float
    client_source: str = "unity"

class ABGroupMetrics(BaseModel):
    agent_count: int
    hazard_trigger_count: int = 0
    avg_path_length: float = 0.0
    avg_completion_time: float = 0.0

class ABTestSummaryRequest(BaseModel):
    test_run_id: str | None = None
    timestamp: datetime | None = None
    total_agents: int | None = None
    group_a: ABGroupMetrics
    group_b: ABGroupMetrics
    metadata: dict | None = None
    client_source: str = "unity"


def _compute_hazard_agent_ratio(hazard_count: int, agent_count: int) -> float:
    safe_count = max(0, int(agent_count))
    safe_hazard_count = max(0, int(hazard_count))
    if safe_count <= 0:
        return 0.0
    return min(safe_hazard_count, safe_count) / safe_count


def _serialize_ab_summary_row(row: ABTestSummary) -> dict:
    group_a_ratio = _compute_hazard_agent_ratio(row.group_a_hazard_triggers, row.group_a_count)
    group_b_ratio = _compute_hazard_agent_ratio(row.group_b_hazard_triggers, row.group_b_count)
    b_safer_than_a70 = group_b_ratio < (group_a_ratio * 0.7) if row.group_a_count > 0 else (group_b_ratio <= 0)
    b_path_longer_or_equal = row.group_b_avg_path_length >= row.group_a_avg_path_length

    return {
        "id": row.id,
        "test_run_id": row.test_run_id,
        "timestamp": row.timestamp.isoformat() if row.timestamp else None,
        "total_agents": row.total_agents,
        "group_a_count": row.group_a_count,
        "group_b_count": row.group_b_count,
        "group_a_hazard_triggers": row.group_a_hazard_triggers,
        "group_b_hazard_triggers": row.group_b_hazard_triggers,
        "group_a_hazard_rate": round(group_a_ratio, 4),
        "group_b_hazard_rate": round(group_b_ratio, 4),
        "group_a_avg_path_length": row.group_a_avg_path_length,
        "group_b_avg_path_length": row.group_b_avg_path_length,
        "group_a_avg_completion_time": row.group_a_avg_completion_time,
        "group_b_avg_completion_time": row.group_b_avg_completion_time,
        "client_source": row.client_source,
        "ready_for_phase4_acceptance": b_safer_than_a70 and b_path_longer_or_equal
    }

@app.post("/api/record_hazard")
def record_hazard(record: HazardRecord, db: Session = Depends(get_db)):
    """
    接收预警信息并写入 SQLite 数据库
    """
    try:
        # 兼容处理：优先使用 hazard_type，如果没有则使用 Unity 发来的 obstacle_type
        h_type = record.hazard_type or record.obstacle_type or "unknown"
        
        # 如果前端没传时间戳，就用服务器当前时间
        log_time = record.timestamp or datetime.now()
        
        new_log = HazardLog(
            timestamp=log_time,
            hazard_type=h_type,
            x=record.x,
            y=record.y,
            z=record.z,
            client_source=record.client_source
        )
        
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        print(f"[{log_time.strftime('%H:%M:%S')}] [警报已入库] 坐标({record.x:.2f}, {record.z:.2f}) 类型: {h_type}")
        
        return {"status": "success", "message": "Hazard recorded to SQLite", "id": new_log.id}
    except Exception as e:
        print(f"写入数据库失败: {e}")
        raise HTTPException(status_code=500, detail="Failed to record hazard to SQLite")

@app.post("/api/ab_test_summary")
def record_ab_test_summary(payload: ABTestSummaryRequest, db: Session = Depends(get_db)):
    try:
        group_a_count = max(0, int(payload.group_a.agent_count))
        group_b_count = max(0, int(payload.group_b.agent_count))
        total_agents = payload.total_agents if payload.total_agents is not None else (group_a_count + group_b_count)
        total_agents = max(0, int(total_agents))

        group_a_hazard = max(0, int(payload.group_a.hazard_trigger_count))
        group_b_hazard = max(0, int(payload.group_b.hazard_trigger_count))
        group_a_rate = _compute_hazard_agent_ratio(group_a_hazard, group_a_count)
        group_b_rate = _compute_hazard_agent_ratio(group_b_hazard, group_b_count)

        test_run_id = payload.test_run_id or f"ab_{int(time.time() * 1000)}"
        run_time = payload.timestamp or datetime.now()

        row = ABTestSummary(
            test_run_id=test_run_id,
            timestamp=run_time,
            total_agents=total_agents,
            group_a_count=group_a_count,
            group_b_count=group_b_count,
            group_a_hazard_triggers=group_a_hazard,
            group_b_hazard_triggers=group_b_hazard,
            group_a_hazard_rate=group_a_rate,
            group_b_hazard_rate=group_b_rate,
            group_a_avg_path_length=float(payload.group_a.avg_path_length),
            group_b_avg_path_length=float(payload.group_b.avg_path_length),
            group_a_avg_completion_time=float(payload.group_a.avg_completion_time),
            group_b_avg_completion_time=float(payload.group_b.avg_completion_time),
            client_source=payload.client_source,
            raw_payload=json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)
        )

        db.add(row)
        db.commit()
        db.refresh(row)

        b_safer_than_a70 = group_b_rate < (group_a_rate * 0.7) if group_a_count > 0 else (group_b_rate <= 0)
        b_path_longer_or_equal = float(payload.group_b.avg_path_length) >= float(payload.group_a.avg_path_length)
        acceptance_ready = b_safer_than_a70 and b_path_longer_or_equal

        return {
            "status": "success",
            "id": row.id,
            "test_run_id": row.test_run_id,
            "metrics": {
                "group_a_hazard_rate": round(group_a_rate, 4),
                "group_b_hazard_rate": round(group_b_rate, 4),
                "group_a_avg_path_length": float(payload.group_a.avg_path_length),
                "group_b_avg_path_length": float(payload.group_b.avg_path_length)
            },
            "acceptance_check": {
                "b_hazard_rate_lt_a_70pct": b_safer_than_a70,
                "b_path_length_gte_a": b_path_longer_or_equal,
                "ready_for_phase4_acceptance": acceptance_ready
            }
        }
    except Exception as e:
        db.rollback()
        print(f"A/B汇总写入失败: {e}")
        raise HTTPException(status_code=500, detail="Failed to record A/B summary")

@app.get("/api/ab_test_summary/latest")
def get_latest_ab_test_summary(db: Session = Depends(get_db)):
    row = db.query(ABTestSummary).order_by(ABTestSummary.timestamp.desc(), ABTestSummary.id.desc()).first()
    if not row:
        return {"status": "empty", "message": "No A/B summary data yet"}
    return {
        "status": "success",
        "data": _serialize_ab_summary_row(row)
    }

@app.get("/api/ab_test_summary/history")
def get_ab_test_summary_history(limit: int = 20, db: Session = Depends(get_db)):
    safe_limit = min(200, max(1, limit))
    rows = db.query(ABTestSummary).order_by(ABTestSummary.timestamp.desc(), ABTestSummary.id.desc()).limit(safe_limit).all()
    return {
        "status": "success",
        "count": len(rows),
        "items": [_serialize_ab_summary_row(row) for row in rows]
    }

@app.get("/api/hazard_heatmap")
def get_hazard_heatmap(top_n: int = 200, db: Session = Depends(get_db)):
    safe_top_n = min(1000, max(1, top_n))
    rows = (
        db.query(
            func.round(HazardLog.x, 1).label("x"),
            func.round(HazardLog.z, 1).label("z"),
            HazardLog.hazard_type.label("hazard_type"),
            func.count(HazardLog.id).label("count")
        )
        .group_by(func.round(HazardLog.x, 1), func.round(HazardLog.z, 1), HazardLog.hazard_type)
        .order_by(func.count(HazardLog.id).desc())
        .limit(safe_top_n)
        .all()
    )
    return {
        "status": "success",
        "count": len(rows),
        "points": [
            {"x": float(r.x or 0.0), "z": float(r.z or 0.0), "hazard_type": r.hazard_type or "unknown", "count": int(r.count)}
            for r in rows
        ]
    }

# --- main.py 里的 Pydantic 模型和接口 ---

# 1. 定义一个全能的数据模型 (包含所有字段)
class BuildingModel(BaseModel):
    id: str
    name: str
    location: str
    area: str = "默认区域"
    image: str = "/static/images/default.jpg"
    history: str = "暂无介绍"
    smell: str = "暂无嗅觉描述"
    material: str = "暂无材质描述"
    safety_note: str = "注意安全"
    latitude: float = 0.0
    longitude: float = 0.0

# ==========================================
# 👇👇👇 修改后的带密码验证的接口 👇👇👇
# ==========================================

# 接口 A：新增建筑 (POST) - 增加密码验证
@app.post("/api/buildings")
def create_building(
    building: BuildingModel, 
    x_admin_password: str = Header(..., alias="x-admin-password") # 👈 检查请求头里的密码
):
    # 🔒 检查密码
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，您没有权限新建建筑！")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO buildings 
               (id, name, location, area, image, history, smell, material, safety_note, latitude, longitude)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (building.id, building.name, building.location, building.area, building.image,
             building.history, building.smell, building.material, building.safety_note,
             building.latitude, building.longitude)
        )
        conn.commit()
        return {"message": "创建成功", "data": building}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="ID已存在，请换一个ID")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 接口 B：更新建筑 (PUT) - 增加密码验证
@app.put("/api/buildings/{building_id}")
def update_building(
    building_id: str, 
    building: BuildingModel,
    x_admin_password: str = Header(..., alias="x-admin-password") # 👈 检查请求头里的密码
):
    # 🔒 检查密码
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，您没有权限修改建筑！")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """UPDATE buildings SET 
               name=?, location=?, area=?, image=?, history=?, 
               smell=?, material=?, safety_note=?, latitude=?, longitude=?
               WHERE id=?""",
            (building.name, building.location, building.area, building.image, 
             building.history, building.smell, building.material, building.safety_note,
             building.latitude, building.longitude, building_id)
        )
        conn.commit()
        return {"message": "更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 接口 C：删除建筑 (DELETE) - 增加密码验证
@app.delete("/api/buildings/{building_id}")
def delete_building(
    building_id: str,
    x_admin_password: str = Header(..., alias="x-admin-password") # 👈 检查请求头里的密码
):
    # 🔒 检查密码
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，您没有权限删除建筑！")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM buildings WHERE id = ?", (building_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
             raise HTTPException(status_code=404, detail="没找到这个建筑，可能已经被删了")
             
        return {"message": "删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
# 4. 挂载前端网页 (dist) - 放在所有API之后
if os.path.exists(dist_path):
    # 挂载 JS/CSS 资源
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    # 【关键】所有未知的请求，都返回 index.html
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # 排除 api 和 static
        if full_path.startswith("api") or full_path.startswith("static"):
            return JSONResponse(status_code=404, content={"message": "Not Found"})
        return FileResponse(os.path.join(dist_path, "index.html"))

# --- 启动部分 ---
if __name__ == "__main__":
    import uvicorn
    # 注意：Host 用 0.0.0.0 才能让 Ngrok 访问
    uvicorn.run(app, host="0.0.0.0", port=8000)
