import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from main import match_place_index

places = [
    "李传别宅",
    "海天堂构",
    "黄荣远堂",
    "许家园",
    "协和礼拜堂",
    "天主教堂",
    "仰高别墅",
]

samples = [
    "你好，我想从李船走到黄蓉远塘该怎么走？",
    "你好怎么从许家园走到海天？",
    "li chuan bie zhai dao huang rong yuan tang",
    "li chuan dao huang rong",
    "海田烫够怎么走",
    "请问怎么从氧高别墅走到许家元？",
    "怎么从眼高别墅走到许家元？",
    "从协和李白堂去徐佳远",
    "请问怎么从杨高别墅到许家园？",
    "怎么从里传？别宅走到海天堂构。",
]

for text in samples:
    hits = []
    for p in places:
        idx, score = match_place_index(p, text)
        if idx != -1:
            hits.append((idx, p, round(score, 2)))
    hits.sort(key=lambda x: x[0])
    print(text)
    print(hits)
