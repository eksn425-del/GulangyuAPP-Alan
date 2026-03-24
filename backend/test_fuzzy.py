import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from main import fuzzy_substring_match

print("黄荣远堂:", fuzzy_substring_match("黄荣远堂", "你好，怎么从黄蓉远塘走到许佳园吗？"))
print("许家园:", fuzzy_substring_match("许家园", "你好，怎么从黄蓉远塘走到许佳园吗？"))
