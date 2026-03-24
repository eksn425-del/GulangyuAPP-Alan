import qrcode
import os

# ================= 配置区 =================

# 🔴 核心修改：如果是给设计师做物料，最好填正式域名
# 如果只是测试，填你电脑的 IP，比如 http://192.168.xx.xx:8000
BASE_URL = "http://192.168.1.100:8000" 

# 建筑列表 (这里是 database.py 里的 7 个建筑)
buildings = [
    {"id": "b_001", "name": "协和礼拜堂"},
    {"id": "b_002", "name": "许家园"},
    {"id": "b_003", "name": "黄荣远堂"},
    {"id": "b_004", "name": "海天堂构"},
    {"id": "b_005", "name": "天主堂"},
    {"id": "b_006", "name": "李传别宅"},
    {"id": "b_007", "name": "仰高别墅"},
]

# 输出文件夹
OUTPUT_DIR = "qrcodes_output"

# ==========================================

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
    
print(f"🚀 开始生成二维码...")

for b in buildings:
    # 构造链接
    url = f"{BASE_URL}/?id={b['id']}"
    
    # 生成高容错率二维码 (ERROR_CORRECT_H = 30% 容错，适合设计师魔改)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # 保存
    file_name = f"{OUTPUT_DIR}/{b['name']}.png"
    img.save(file_name)
    print(f"✅ 生成完毕: {file_name} -> {url}")

print(f"\n🎉 全部完成！文件夹位置: {os.path.abspath(OUTPUT_DIR)}")