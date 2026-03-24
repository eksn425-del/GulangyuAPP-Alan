import sys
import os
import math

def calculate_bearing(lat1, lon1, lat2, lon2):
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    diff_lon = math.radians(lon2 - lon1)
    x = math.sin(diff_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(diff_lon))
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    return compass_bearing

nodes = {
    "仰高别墅": (24.442944, 118.072207),
    "路口10": (24.443316, 118.072774),
    "路口4": (24.443001, 118.073244),
    "许家园": (24.443499, 118.073584)
}

b1 = calculate_bearing(*nodes["仰高别墅"], *nodes["路口10"])
b2 = calculate_bearing(*nodes["路口10"], *nodes["路口4"])
b3 = calculate_bearing(*nodes["路口4"], *nodes["许家园"])

print(f"仰高别墅 -> 路口10: {b1}")
print(f"路口10 -> 路口4: {b2}")
print(f"路口4 -> 许家园: {b3}")

def get_turn_instruction(current_bearing, next_bearing):
    diff = (next_bearing - current_bearing + 360) % 360
    if diff < 30 or diff > 330:
        return "直行"
    elif 30 <= diff <= 150:
        return "右转"
    elif 150 < diff < 210:
        return "掉头"
    else:
        return "左转"

print(f"Turn at 路口10: {get_turn_instruction(b1, b2)}")
print(f"Turn at 路口4: {get_turn_instruction(b2, b3)}")
