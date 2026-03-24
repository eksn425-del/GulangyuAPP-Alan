import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

import pypinyin

def get_pinyin(text_str):
    if not text_str: return ""
    return "".join(pypinyin.lazy_pinyin(text_str, style=pypinyin.Style.NORMAL))

print(get_pinyin("李船别宅"))
print(get_pinyin("李传别宅"))