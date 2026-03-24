import sqlite3
import random
import os
from datetime import datetime, timedelta

# 配置数据库路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, "gulangyu.db")

def generate_data():
    print(f"🔌 连接数据库: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. 创建 user_visits 表
    print("📦 创建 user_visits 表...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_id TEXT,
        interaction_type TEXT,
        timestamp DATETIME,
        FOREIGN KEY(building_id) REFERENCES buildings(id)
    )
    ''')

    # 2. 清空旧数据 (可选，为了演示效果先清空)
    cursor.execute("DELETE FROM user_visits")
    print("🧹 清空旧数据...")

    # 3. 获取所有建筑 ID
    cursor.execute("SELECT id FROM buildings")
    buildings = [row[0] for row in cursor.fetchall()]
    
    if not buildings:
        print("⚠️ 警告: buildings 表为空，无法生成关联数据。请先运行 main.py 或 database.py 初始化建筑数据。")
        conn.close()
        return

    # 4. 生成模拟数据
    print("🎲 生成模拟数据...")
    interaction_types = ['扫码识别', '语音交互', '手动点击', 'NFC感应', '视觉识别']
    
    # 生成 500 条数据
    for _ in range(500):
        building_id = random.choice(buildings)
        interaction = random.choice(interaction_types)
        
        # 生成过去 30 天内的随机时间
        days_ago = random.randint(0, 30)
        seconds_ago = random.randint(0, 86400)
        timestamp = datetime.now() - timedelta(days=days_ago, seconds=seconds_ago)
        
        cursor.execute('''
        INSERT INTO user_visits (building_id, interaction_type, timestamp)
        VALUES (?, ?, ?)
        ''', (building_id, interaction, timestamp))

    conn.commit()
    print(f"✅ 成功生成 500 条访问记录！")
    
    # 5. 验证数据
    cursor.execute("SELECT COUNT(*) FROM user_visits")
    count = cursor.fetchone()[0]
    print(f"📊 当前 user_visits 表总行数: {count}")

    conn.close()

if __name__ == "__main__":
    generate_data()
