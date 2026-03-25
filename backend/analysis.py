import sqlite3
import pandas as pd
import os
from datetime import datetime

def get_phase4_ab_report():
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, "gulangyu.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ab_test_summaries'")
        has_ab = cursor.fetchone() is not None
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='hazard_logs'")
        has_hazard = cursor.fetchone() is not None

        if not has_ab:
            conn.close()
            return {"error": "ab_test_summaries 表不存在", "latest": None, "history": [], "hazard_heatmap_top": []}

        df_ab = pd.read_sql("SELECT * FROM ab_test_summaries ORDER BY timestamp DESC, id DESC", conn)
        if df_ab.empty:
            conn.close()
            return {"latest": None, "history": [], "hazard_heatmap_top": []}

        latest = df_ab.iloc[0].to_dict()
        group_a_rate = float(latest.get("group_a_hazard_rate", 0.0) or 0.0)
        group_b_rate = float(latest.get("group_b_hazard_rate", 0.0) or 0.0)
        group_a_len = float(latest.get("group_a_avg_path_length", 0.0) or 0.0)
        group_b_len = float(latest.get("group_b_avg_path_length", 0.0) or 0.0)
        b_hazard_lt_a_70 = group_b_rate < (group_a_rate * 0.7) if group_a_rate > 0 else (group_b_rate <= 0)
        b_len_gte_a = group_b_len >= group_a_len

        history_cols = [
            "test_run_id", "timestamp", "total_agents",
            "group_a_hazard_rate", "group_b_hazard_rate",
            "group_a_avg_path_length", "group_b_avg_path_length"
        ]
        history = df_ab[history_cols].head(20).fillna(0).to_dict(orient="records")

        heatmap_top = []
        if has_hazard:
            df_hazard = pd.read_sql("SELECT hazard_type, x, z FROM hazard_logs", conn)
            if not df_hazard.empty:
                df_hazard["x_bin"] = df_hazard["x"].round(1)
                df_hazard["z_bin"] = df_hazard["z"].round(1)
                grouped = (
                    df_hazard.groupby(["hazard_type", "x_bin", "z_bin"])
                    .size()
                    .reset_index(name="count")
                    .sort_values("count", ascending=False)
                    .head(200)
                )
                heatmap_top = grouped.to_dict(orient="records")

        conn.close()
        return {
            "latest": {
                "test_run_id": latest.get("test_run_id"),
                "timestamp": latest.get("timestamp"),
                "total_agents": int(latest.get("total_agents", 0) or 0),
                "group_a_hazard_rate": round(group_a_rate, 4),
                "group_b_hazard_rate": round(group_b_rate, 4),
                "group_a_avg_path_length": round(group_a_len, 4),
                "group_b_avg_path_length": round(group_b_len, 4),
                "b_hazard_rate_lt_a_70pct": bool(b_hazard_lt_a_70),
                "b_path_length_gte_a": bool(b_len_gte_a),
                "ready_for_phase4_acceptance": bool(b_hazard_lt_a_70 and b_len_gte_a)
            },
            "history": history,
            "hazard_heatmap_top": heatmap_top
        }
    except Exception as e:
        return {"error": str(e), "latest": None, "history": [], "hazard_heatmap_top": []}

def get_analytics_data():
    """
    获取数据分析结果
    
    Returns:
        dict: 包含以下字段的字典：
            - total_visits: 总访问量
            - top_buildings: 访问量前5的建筑列表（list of dict）
            - interactions: 交互类型统计（list of dict）
            - error: 如果出错，返回错误信息
    """
    try:
        # 1. 连接数据库
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, "gulangyu.db")
        conn = sqlite3.connect(db_path)
        
        # 2. 检查 user_visits 表是否存在
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_visits'")
        if not cursor.fetchone():
            conn.close()
            return {
                "error": "user_visits 表不存在，请先运行数据生成脚本",
                "total_visits": 0,
                "top_buildings": [],
                "interactions": []
            }
        
        # 3. 读取数据
        df_logs = pd.read_sql("SELECT * FROM user_visits", conn)
        df_buildings = pd.read_sql("SELECT id, name FROM buildings", conn)
        
        # 如果表为空
        if df_logs.empty:
            conn.close()
            return {
                "total_visits": 0,
                "top_buildings": [],
                "interactions": []
            }
        
        # 4. 计算总访问量
        total_visits = len(df_logs)
        
        # 5. 计算热门建筑（访问量前5）
        popularity = df_logs.groupby('building_id').size().reset_index(name='visit_count')
        popularity = popularity.sort_values('visit_count', ascending=False).head(5)
        
        # 关联建筑名称
        top_buildings = popularity.merge(df_buildings, left_on='building_id', right_on='id', how='left')
        top_buildings = top_buildings.fillna({'name': '未知建筑'})
        top_buildings_list = top_buildings[['name', 'visit_count']].to_dict(orient='records')
        
        # 6. 统计交互类型
        interaction_stats = df_logs.groupby('interaction_type').size().reset_index(name='count')
        interactions_list = interaction_stats.to_dict(orient='records')
        
        conn.close()
        
        return {
            "total_visits": int(total_visits),
            "top_buildings": top_buildings_list,
            "interactions": interactions_list
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "total_visits": 0,
            "top_buildings": [],
            "interactions": []
        }

# 测试代码（保留用于调试）
if __name__ == "__main__":
    result = get_analytics_data()
    print("\n📊 分析结果：")
    print(f"总访问量: {result.get('total_visits', 0)}")
    print(f"\n热门建筑 Top 5:")
    for building in result.get('top_buildings', []):
        print(f"  - {building.get('name', '未知')}: {building.get('visit_count', 0)} 次访问")
    print(f"\n交互类型统计:")
    for interaction in result.get('interactions', []):
        print(f"  - {interaction.get('interaction_type', '未知')}: {interaction.get('count', 0)} 次")
    phase4 = get_phase4_ab_report()
    print("\n🧪 Phase4 A/B:")
    print(phase4.get("latest"))
