import requests
import json

data = {
    "message": "你好，我想从李船走到黄蓉远塘该怎么走？"
}

resp = requests.post("http://localhost:8000/api/chat", json=data)
print(resp.json())