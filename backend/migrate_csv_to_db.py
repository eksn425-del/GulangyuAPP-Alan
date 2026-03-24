import csv
import os
import sys
from datetime import datetime

# 添加当前目录到 sys.path 以便导入 database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, HazardLog, init_sqlalchemy

# 配置 CSV 文件路径 (假设就在当前目录下)
csv_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "accident_logs.csv")

def migrate_data():
    # 1. 确保数据库表已创建
    init_sqlalchemy()
    
    # 2. 检查 CSV 是否存在
    if not os.path.exists(csv_file_path):
        print(f"❌ 未找到 CSV 文件: {csv_file_path}")
        return

    print(f"⏳ 开始迁移数据: {csv_file_path} -> SQLite")
    
    db = SessionLocal()
    count = 0
    
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            logs_to_insert = []
            for row in reader:
                try:
                    # 解析时间戳 (兼容不同格式，或者使用默认值)
                    ts_str = row.get('timestamp')
                    ts = datetime.now()
                    if ts_str:
                        try:
                            ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                        except ValueError:
                            # 尝试 ISO 格式或其他
                            try:
                                ts = datetime.fromisoformat(ts_str)
                            except:
                                print(f"⚠️ 时间格式无法解析: {ts_str}，使用当前时间")
                    
                    log = HazardLog(
                        timestamp=ts,
                        hazard_type=row.get('hazard_type', 'unknown'),
                        x=float(row.get('x', 0)),
                        y=float(row.get('y', 0)),
                        z=float(row.get('z', 0)),
                        client_source=row.get('client_source', 'unity')
                    )
                    logs_to_insert.append(log)
                    count += 1
                except Exception as e:
                    print(f"⚠️ 跳过错误行: {row} - {e}")
            
            # 批量写入
            if logs_to_insert:
                db.add_all(logs_to_insert)
                db.commit()
                print(f"✅ 成功迁移 {count} 条数据！")
            else:
                print("⚠️ CSV 文件为空或无有效数据")
                
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_data()
