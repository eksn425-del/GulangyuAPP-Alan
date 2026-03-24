import sqlite3
import os

DB_NAME = "gulangyu.db"
backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, DB_NAME)

def check_schema():
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} does not exist.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"✅ Database found at {db_path}")
    
    tables = ["buildings", "accessibility_nodes", "roads"]
    for table in tables:
        print(f"\n🔍 Checking table: {table}")
        try:
            # Check data count
            count = cursor.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
            print(f"   📊 Total rows: {count}")
            
            # Print columns if needed (commented out to keep output clean)
            # cursor.execute(f"PRAGMA table_info({table})")
            # columns = cursor.fetchall()
            # for col in columns:
            #     print(f"   - {col[1]}")

        except sqlite3.Error as e:
            print(f"   ❌ Error checking table {table}: {e}")
            
    conn.close()

if __name__ == "__main__":
    check_schema()
