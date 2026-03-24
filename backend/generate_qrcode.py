import qrcode
import os
from PIL import Image

# ================= 配置区 =================

# 1. 你的域名 (非常重要！)
# 如果是本地测试，填你的局域网IP (如 http://192.168.1.5:8000)
# 如果是正式上线，填你的域名 (如 https://gulangyu.app)
# 如果用 Ngrok，填 Ngrok 地址 (如 https://xxxx.ngrok-free.app)
BASE_URL = "http://192.168.1.100:8000"  # 👈 请修改这里！！

# 2. 建筑列表 (对应 database.py)
buildings = [
    {"id": "b_001", "name": "协和礼拜堂"},
    {"id": "b_002", "name": "许家园"},
    {"id": "b_003", "name": "黄荣远堂"},
    {"id": "b_004", "name": "海天堂构"},
    {"id": "b_005", "name": "天主堂"},
    {"id": "b_006", "name": "李传别宅"},
    {"id": "b_007", "name": "仰高别墅"},
]

# 3. 输出文件夹
OUTPUT_DIR = "qrcodes_output"

# ==========================================

def generate():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"🚀 开始生成二维码，目标域名: {BASE_URL}")

    for b in buildings:
        # 1. 拼接 URL (对应前端 App.jsx 的解析逻辑)
        # 格式: 域名/?id=b_001
        url = f"{BASE_URL}/?id={b['id']}"
        
        # 2. 创建二维码对象
        qr = qrcode.QRCode(
            version=1,
            # 🔥 关键：设置最高容错率 (High)，允许 30% 的遮挡或损坏
            # 这样设计师可以在上面画画、加纹理，依然能扫出来
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=20, # 图片大一点，清晰
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # 3. 生成图片
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 4. 保存文件
        file_name = f"{OUTPUT_DIR}/{b['name']}_{b['id']}.png"
        img.save(file_name)
        print(f"✅ 已生成: {file_name} -> {url}")

    print(f"\n🎉 全部完成！请把 {OUTPUT_DIR} 文件夹发给设计师。")

if __name__ == "__main__":
    generate()