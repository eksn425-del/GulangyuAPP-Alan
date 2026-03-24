import sys
import os

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from graph_engine import route_engine
import json

def test_route():
    print("Testing route from 仰高别墅入口 (node_xm_glangyu_21) to 协和礼拜堂入口 (node_xm_glangyu_01)")
    result = route_engine.get_safest_route('node_xm_glangyu_21', 'node_xm_glangyu_01')
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_route()
