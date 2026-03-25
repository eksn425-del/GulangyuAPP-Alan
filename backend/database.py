import sqlite3
import os

# 1. 数据库文件路径
DB_NAME = "gulangyu.db"
backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, DB_NAME)

# 2. 原始数据 (建筑 - 完整保留)
buildings_data = [
  {
    "id": "b_001",
    "name": "协和礼拜堂",
    "location": "福建路 60-1 号",
    "area": "文化地标区",
    "image": "/static/images/b_001.jpg",
    "history": "【万国俱乐部】旁，建于1863年，是鼓浪屿最早的教堂。著名作家林语堂曾在此举办婚礼。虽然不大，却是岛上西式婚礼的首选地。",
    "smell": "海风带来的咸湿气味，混合着旁边百年古榕树散发的淡淡树脂清香。",
    "material": "触感重点：新古典主义立面。墙面有许多规则的几何线条，触摸时能感觉到石材的冰凉与坚硬。",
    "safety_note": "位于三岔路口，门前广场游客拍照较多，请注意避让。",
    "latitude": 24.444123,
    "longitude": 118.064123
  },
  {
    "id": "b_002",
    "name": "许家园",
    "location": "福建路 34 号",
    "area": "居住风貌区",
    "image": "/static/images/b_002.jpg",
    "history": "建于20世纪30年代，是典型的华侨私家园林。它不像其他豪宅那样张扬，保留了大量当年华侨生活的温馨痕迹。",
    "smell": "雨后有浓郁的泥土腥气和苔藓味道，是一种潮湿、安静的老房子气味。",
    "material": "触感重点：花岗岩围墙。触摸时能感觉到粗糙自然的纹理，与光滑的红砖形成对比。",
    "safety_note": "外部巷道狭窄，路面铺有不规则鹅卵石，盲杖容易卡入缝隙，请慢行。",
    "latitude": 24.443123,
    "longitude": 118.063123
  },
  {
    "id": "b_003",
    "name": "黄荣远堂",
    "location": "福建路 32 号",
    "area": "音乐核心区",
    "image": "/static/images/b_003.jpg", 
    "history": "建于1920年，由菲律宾华侨施光从始建，后转手黄仲训。它是“会唱歌的房子”，现为中国唱片博物馆，拥有壮观的爱奥尼克巨柱和弧形回廊。",
    "smell": "馆内空气中常有一股陈旧黑胶唱片纸套的独特书卷气，混合着老木地板的蜡味。",
    "material": "触感重点：爱奥尼克巨柱。柱体表面打磨得十分光滑冰凉，柱头有卷曲的涡旋装饰。",
    "safety_note": "庭院入口有不规则的弧形台阶，进入回廊时请注意脚下高差。",
    "latitude": 24.445123,
    "longitude": 118.065123
  },
  {
    "id": "b_004",
    "name": "海天堂构",
    "location": "福建路 38 号",
    "area": "历史风貌区",
    "image": "/static/images/b_004.jpg",
    "history": "建于1921年，鼓浪屿十大别墅之首。中式飞檐大屋顶压在西式红砖廊柱上，俗称“穿西装戴斗笠”，彰显了华侨黄秀烺的爱国情怀。",
    "smell": "院内常年进行南音表演，飘散着功夫茶的清香和淡淡的檀香。",
    "material": "触感重点：清水红砖与水洗砂。红砖触感细腻温暖，水洗砂墙面则有颗粒感。",
    "safety_note": "正门设有传统中式高门槛（约15cm高），请务必抬高脚步跨越。",
    "latitude": 24.446123,
    "longitude": 118.066123
  },
  {
    "id": "b_005",
    "name": "天主堂",
    "location": "鹿礁路 34-2 号",
    "area": "宗教文化区",
    "image": "/static/images/b_005.jpg",
    "history": "建于1917年，鼓浪屿唯一一座纯白色的哥特式教堂。尖塔高耸，曾是岛上的最高建筑。",
    "smell": "空气中常年有一种清冷的石灰味，周日礼拜时会有淡淡的乳香气味。",
    "material": "触感重点：外墙灰塑。摸起来有细腻的粉末感，尖拱门边缘线条锋利。",
    "safety_note": "入口台阶非常陡峭且狭窄，建议抓紧两侧扶手。",
    "latitude": 24.447123,
    "longitude": 118.067123
  },
  {
    "id": "b_006",
    "name": "李传别宅",
    "location": "福建路 44 号",
    "area": "幽静住宅区",
    "image": "/static/images/b_006.jpg",
    "history": "建于1928年，红砖拼花工艺精湛。这座建筑的特色在于它精美的红砖砌筑技巧，是“红砖文化”的杰作。",
    "smell": "这里也是居民区，空气中常飘来饭菜香和肥皂味，充满了生活气息。",
    "material": "触感重点：拼花红砖。手感凹凸有致，能摸到砖块拼接的缝隙。",
    "safety_note": "入口处坡度较陡，且处于视线盲区，建议贴墙行走。",
    "latitude": 24.448123,
    "longitude": 118.068123
  },
  {
    "id": "b_007",
    "name": "仰高别墅",
    "location": "福建路 40 号",
    "area": "山地风貌区",
    "image": "/static/images/b_007.jpg",
    "history": "依地势而建的代表性建筑。为了适应山地地形，建筑采用了独特的基础结构，是“顺应自然”理念的体现。",
    "smell": "地势较高，空气流通性好，能闻到更纯净、带有盐分的海风味，少了街道的尘土气。",
    "material": "触感重点：石砌基座。为了稳固，底部使用了巨大的花岗岩块，触感粗粝坚硬。",
    "safety_note": "需要攀爬一段长台阶才能到达，且台阶两侧可能无连续扶手，视障人士强烈建议由陪伴者引导。",
    "latitude": 24.449123,
    "longitude": 118.069123
  }
]

# 2.1 原始数据 (无障碍节点 Nodes) - 严格按照 Markdown 表格录入
# 对应图片编号 -> /static/pictures/node_xxx.jpg
nodes_data = [
    # 1. 协和礼拜堂入口 (User requested replacement)
    {"node_id": "node_xm_glangyu_01", "img_ref": "node_001", "node_type": "建筑入口", "name": "协和礼拜堂入口", "lat_lng": "118.072568,24.444064", "audio_ambient": "鸟声，风声", "smell": "无", "model_path": "模型1", "detail": "入口有两部分台阶（七阶和三阶），中间有一段平地连接。大门入口处地面较光滑，请注意防滑。"},
    
    {"node_id": "node_xm_glangyu_02", "img_ref": "node_002", "node_type": "路口", "name": "路口1", "lat_lng": "118.071652,24.443457", "audio_ambient": "风声和略嘈杂声", "smell": "茶香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_03", "img_ref": "node_003", "node_type": "路口", "name": "路口2", "lat_lng": "118.072169,24.442898", "audio_ambient": "风声，鸟叫和略微嘈杂游客声", "smell": "无", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_04", "img_ref": "node_004", "node_type": "转角", "name": "转角处1 (路口2到路口3之间)", "lat_lng": "118.072440,24.442590", "audio_ambient": "风声，鸟声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_05", "img_ref": "node_005", "node_type": "路口", "name": "路口3", "lat_lng": "118.072965,24.442208", "audio_ambient": "鸟声，游客嘈杂声", "smell": "花香和闻香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_06", "img_ref": "node_006", "node_type": "路口", "name": "路口4", "lat_lng": "118.073244,24.443001", "audio_ambient": "鸟声，游客嘈杂声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_07", "img_ref": "node_007", "node_type": "转角", "name": "转角2 (路口4到路口5之间)", "lat_lng": "118.073386,24.443379", "audio_ambient": "风声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_08", "img_ref": "node_008", "node_type": "路口", "name": "路口5", "lat_lng": "118.073658,24.443637", "audio_ambient": "机器轰鸣声和商家店铺播放音乐声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_09", "img_ref": "node_009", "node_type": "转角", "name": "转角处3 (路口5到路口6之间)", "lat_lng": "118.073222,24.444147", "audio_ambient": "鸟声，风声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_10", "img_ref": "node_010", "node_type": "路口", "name": "路口6", "lat_lng": "118.072857,24.444644", "audio_ambient": "鸟声", "smell": "花香", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_11", "img_ref": "node_011", "node_type": "转角", "name": "转角处4", "lat_lng": "118.072625,24.444529", "audio_ambient": "鸟声，游客嘈杂声音", "smell": "生姜味 (姜母茶商店)", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_12", "img_ref": "node_012", "node_type": "路口", "name": "路口7", "lat_lng": "118.072440,24.444226", "audio_ambient": "鸟声，风声", "smell": "咖啡味 (咖啡店)", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_13", "img_ref": "node_013", "node_type": "路口", "name": "路口8", "lat_lng": "118.072645,24.443930", "audio_ambient": "鸟声，游客比较大的嘈杂声", "smell": "无", "model_path": "有 (协和礼拜堂门口)", "detail": ""},
    {"node_id": "node_xm_glangyu_14", "img_ref": "node_014", "node_type": "休息点", "name": "休息点1", "lat_lng": "118.072518,24.443865", "audio_ambient": "鸟声，游客谈论嘈杂声", "smell": "烟味", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_15", "img_ref": "node_015", "node_type": "路口", "name": "路口9 (中间有个喷泉雕塑)", "lat_lng": "118.072464,24.443777", "audio_ambient": "鸟声，游客嘈杂讨论声", "smell": "无", "model_path": "无", "detail": ""},
    {"node_id": "node_xm_glangyu_16", "img_ref": "node_016", "node_type": "路口", "name": "路口10", "lat_lng": "118.072774,24.443316", "audio_ambient": "风声，鸟声", "smell": "无", "model_path": "无", "detail": ""},
    
    # 2. 天主教堂侧门
    {"node_id": "node_xm_glangyu_17", "img_ref": "node_017", "node_type": "建筑入口", "name": "天主教堂侧门", "lat_lng": "118.072714,24.443442", "audio_ambient": "有鸟的叫声，有场内拍:婚纱照的声音", "smell": "无", "model_path": "模型2", "detail": "入口处有一个小台阶，进门后立刻有一小段下坡，请小心脚下不要绊倒。"},
    
    # 3. 李传别宅入口
    {"node_id": "node_xm_glangyu_18", "img_ref": "node_018", "node_type": "建筑入口", "name": "李传别宅入口", "lat_lng": "118.072707,24.443280", "audio_ambient": "有风声和鸟叫声", "smell": "无", "model_path": "模型3", "detail": "入口有两个台阶，阶梯材质为粗糙石头，请注意抬脚。"},
    
    # 4. 海天堂构入口
    {"node_id": "node_xm_glangyu_19", "img_ref": "node_019", "node_type": "建筑入口", "name": "海天堂构入口", "lat_lng": "118.073020,24.443065", "audio_ambient": "有游客的嘈杂声，鸟声", "smell": "无", "model_path": "模型4", "detail": "正门设有较高的门槛，请务必抬高脚步跨越。"},
    
    # 5. 黄荣远堂入口
    {"node_id": "node_xm_glangyu_20", "img_ref": "node_020", "node_type": "建筑入口", "name": "黄荣远堂入口", "lat_lng": "118.073061,24.443030", "audio_ambient": "鸟叫声和游客嘈杂声", "smell": "无", "model_path": "模型5", "detail": "门口仅有一个小台阶，注意脚下即可。"},
    
    # 6. 仰高别墅入口
    {"node_id": "node_xm_glangyu_21", "img_ref": "node_021", "node_type": "建筑入口", "name": "仰高别墅入口", "lat_lng": "118.072207,24.442944", "audio_ambient": "有鸟声", "smell": "无", "model_path": "模型6", "detail": "入口处有四个台阶，石头材质稍微有些光滑，请注意防滑慢行。"},
    
    # 7. 许家园入口
    {"node_id": "node_xm_glangyu_22", "img_ref": "node_022", "node_type": "建筑入口", "name": "许家园入口", "lat_lng": "118.073584,24.443499", "audio_ambient": "有售卖的吆喝声，有风声", "smell": "无", "model_path": "模型7", "detail": "入口处一半是斜坡，一半是平地。踏入台阶之后的平地石砖比较光滑，请小心地滑。"}
]

# 2.2 原始数据 (路径 Edges) - 严格按照 Markdown 表格录入
# 对应图片编号 -> /static/pictures/edge_xxx.jpg (多个用分号连接)
roads_data = [
    {
        "edge_id": "edge_glangyu_01", "img_refs": ["edge_001", "edge_002"], 
        "start_node": "node_xm_glangyu_02", "end_node": "node_xm_glangyu_03", 
        "material": "大的光滑石砖和小的略微凸起的粗糙石砖结合", "width_m": 4.5, "slope_deg": 0.5, "friction": 0.5, 
        "note": "全程上坡路段"
    },
    {
        "edge_id": "edge_glangyu_02", "img_refs": ["edge_003", "edge_004", "edge_005"], 
        "start_node": "node_xm_glangyu_03", "end_node": "node_xm_glangyu_05", 
        "material": "大的光滑石砖和小的略微凸起的粗糙石砖结合", "width_m": 4.0, "slope_deg": 5.0, "friction": 0.5, 
        "note": "两段式路段，分界点为转角处1 (node_04)"
    },
    {
        "edge_id": "edge_glangyu_03", "img_refs": ["edge_006", "edge_007", "edge_008"], 
        "start_node": "node_xm_glangyu_05", "end_node": "node_xm_glangyu_06", 
        "material": "全部为小型的正方形凸起石头", "width_m": 5.0, "slope_deg": 0.0, "friction": 0.8, 
        "note": "中间段略为S型，无明显转角处"
    },
    {
        "edge_id": "edge_glangyu_04", "img_refs": ["edge_009", "edge_010"], 
        "start_node": "node_xm_glangyu_06", "end_node": "node_xm_glangyu_08", 
        "material": "全部为小型的正方形凸起石头", "width_m": 3.0, "slope_deg": 6.0, "friction": 0.8, 
        "note": "中间途经转角2 (node_07)，前后坡度不同"
    },
    {
        "edge_id": "edge_glangyu_05", "img_refs": ["edge_011", "edge_012"], 
        "start_node": "node_xm_glangyu_08", "end_node": "node_xm_glangyu_10", 
        "material": "全部为小型的正方形凸起石头", "width_m": 3.0, "slope_deg": 2.0, "friction": 0.8, 
        "note": "途经转角处3 (node_09)，路段为鹿礁路"
    },
    {
        "edge_id": "edge_glangyu_06", "img_refs": ["edge_013", "edge_014"], 
        "start_node": "node_xm_glangyu_10", "end_node": "node_xm_glangyu_12", 
        "material": "全部为小型的正方形凸起石头", "width_m": 3.0, "slope_deg": 2.0, "friction": 0.8, 
        "note": "中间途经转角处4 (node_11)"
    },
    {
        "edge_id": "edge_glangyu_07", "img_refs": ["edge_015"], 
        "start_node": "node_xm_glangyu_12", "end_node": "node_xm_glangyu_13", 
        "material": "全部为小型的正方形凸起石头", "width_m": 7.0, "slope_deg": 4.0, "friction": 0.8, 
        "note": "中间途经协和礼拜堂，尽头为天主堂"
    },
    {
        "edge_id": "edge_glangyu_08", "img_refs": ["edge_016"], 
        "start_node": "node_xm_glangyu_13", "end_node": "node_xm_glangyu_15", 
        "material": "全部为小型的正方形凸起石头", "width_m": 7.0, "slope_deg": 0.0, "friction": 0.8, 
        "note": "途经休息点1 (node_14)，左侧为天主教堂，右侧为协和礼拜堂"
    },
    {
        "edge_id": "edge_glangyu_09", "img_refs": ["edge_017"], 
        "start_node": "node_xm_glangyu_15", "end_node": "node_xm_glangyu_16", 
        "material": "全部为小型正方形凸起石头", "width_m": 3.0, "slope_deg": 3.0, "friction": 0.8, 
        "note": "左侧为天主教堂，右侧为李传别宅"
    },
    {
        "edge_id": "edge_glangyu_10", "img_refs": ["edge_018"], 
        "start_node": "node_xm_glangyu_16", "end_node": "node_xm_glangyu_03", 
        "material": "全部为小型正方形凸起石头", "width_m": 3.0, "slope_deg": 2.0, "friction": 0.8, 
        "note": "左侧为海天堂构，右侧为李传别宅"
    },
    {
        "edge_id": "edge_glangyu_11", "img_refs": ["edge_019"], 
        "start_node": "node_xm_glangyu_16", "end_node": "node_xm_glangyu_06", 
        "material": "全部为小型正方形凸起石头", "width_m": 3.0, "slope_deg": 1.0, "friction": 0.8, 
        "note": "左侧为黄荣远堂，右侧为海天堂构"
    },
    {
        "edge_id": "edge_glangyu_12", "img_refs": ["edge_020"], 
        "start_node": "node_xm_glangyu_15", "end_node": "node_xm_glangyu_02", 
        "material": "大的光滑石砖和小的略微凸起的粗糙石砖结合", "width_m": 7.0, "slope_deg": 0.5, "friction": 0.5, 
        "note": "全程下坡路段"
    }
]

def get_db_connection():
    """获取数据库连接，返回配置了 Row factory 的连接对象"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. 建表
    print("⏳ 正在创建数据库表...")
    
    # 建筑表 (保留)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        area TEXT,
        image TEXT,
        history TEXT,
        smell TEXT,
        material TEXT,
        safety_note TEXT,
        latitude REAL,
        longitude REAL
    )
    ''')

    # 1.1 创建无障碍节点表 (Nodes) - 增加 detail 字段存储详细描述
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS accessibility_nodes (
        node_id TEXT PRIMARY KEY,
        node_type TEXT,
        name TEXT,
        lat_lng TEXT,
        latitude REAL,
        longitude REAL,
        audio_ambient TEXT,
        smell TEXT,
        image TEXT,
        model_path TEXT,
        detail TEXT
    )
    ''')

    # 1.2 创建路径表 (Roads) - 字段重命名以匹配 Markdown 规范
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS roads (
        edge_id TEXT PRIMARY KEY,
        start_node TEXT,
        end_node TEXT,
        material TEXT,
        width_m REAL,
        slope_deg REAL,
        friction REAL,
        note TEXT,
        image TEXT,
        FOREIGN KEY(start_node) REFERENCES accessibility_nodes(node_id),
        FOREIGN KEY(end_node) REFERENCES accessibility_nodes(node_id)
    )
    ''')

    # 2. 插入数据 (先清空旧数据)
    cursor.execute("DELETE FROM buildings")
    cursor.execute("DELETE FROM accessibility_nodes")
    cursor.execute("DELETE FROM roads")
    
    # 2.1 插入建筑数据
    for b in buildings_data:
        cursor.execute('''
        INSERT INTO buildings (id, name, location, area, image, history, smell, material, safety_note, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            b['id'], b['name'], b.get('location', ''), b.get('area', ''), b['image'], 
            b['history'], b['smell'], b['material'], b['safety_note'], 
            b['latitude'], b['longitude']
        ))

    # 2.2 插入节点数据
    for n in nodes_data:
        # 解析经纬度
        try:
            lng_str, lat_str = n['lat_lng'].split(',')
            lng = float(lng_str.strip())
            lat = float(lat_str.strip())
        except:
            lng, lat = 0.0, 0.0
            
        # 构建图片路径
        image_path = f"/static/pictures/{n['img_ref']}.jpg"
        
        cursor.execute('''
        INSERT INTO accessibility_nodes (node_id, node_type, name, lat_lng, latitude, longitude, audio_ambient, smell, image, model_path, detail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            n['node_id'], n['node_type'], n['name'], n['lat_lng'], lat, lng, 
            n['audio_ambient'], n['smell'], image_path, n['model_path'], n.get('detail', '')
        ))

    # 2.3 插入路径数据
    for r in roads_data:
        # 构建图片路径 (支持多张图片)
        image_paths = ";".join([f"/static/pictures/{ref}.jpg" for ref in r['img_refs']])
        
        cursor.execute('''
        INSERT INTO roads (edge_id, start_node, end_node, material, width_m, slope_deg, friction, note, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            r['edge_id'], r['start_node'], r['end_node'], r['material'], 
            r['width_m'], r['slope_deg'], r['friction'], r['note'], image_paths
        ))
    
    conn.commit()
    conn.close()
    print(f"✅ 数据库初始化成功！文件位置: {db_path}")

# ==========================================
# 👇 SQLAlchemy Setup
# ==========================================
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HazardLog(Base):
    __tablename__ = "hazard_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    hazard_type = Column(String, index=True)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)
    client_source = Column(String, index=True, default="unknown")

class ABTestSummary(Base):
    __tablename__ = "ab_test_summaries"
    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.now, index=True)
    total_agents = Column(Integer, default=0)
    group_a_count = Column(Integer, default=0)
    group_b_count = Column(Integer, default=0)
    group_a_hazard_triggers = Column(Integer, default=0)
    group_b_hazard_triggers = Column(Integer, default=0)
    group_a_hazard_rate = Column(Float, default=0.0)
    group_b_hazard_rate = Column(Float, default=0.0)
    group_a_avg_path_length = Column(Float, default=0.0)
    group_b_avg_path_length = Column(Float, default=0.0)
    group_a_avg_completion_time = Column(Float, default=0.0)
    group_b_avg_completion_time = Column(Float, default=0.0)
    client_source = Column(String, index=True, default="unity")
    raw_payload = Column(Text, default="{}")

def init_sqlalchemy():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    init_sqlalchemy()
