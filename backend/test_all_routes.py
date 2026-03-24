import sys
import os
import json

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from graph_engine import route_engine
from database import get_db_connection

def test_all():
    conn = get_db_connection()
    nodes = conn.execute("SELECT * FROM accessibility_nodes WHERE node_type='建筑入口'").fetchall()
    conn.close()
    
    buildings = [(n['node_id'], n['name']) for n in nodes]
    
    for start_id, start_name in buildings:
        for end_id, end_name in buildings:
            if start_id == end_id: continue
            
            result = route_engine.get_safest_route(start_id, end_id, user_type="blind")
            if not result.get("success"):
                print(f"{start_name} -> {end_name}: 失败 {result.get('error')}")
                continue
                
            route = result['routes'][0]
            merged_steps = []
            for i, step in enumerate(route['steps']):
                dist = step['distance']
                turn = step.get('turn_instruction', '直行')
                to_name = step['to_name']
                
                if "路口" in to_name:
                    display_name = "一个路口"
                elif "转角" in to_name:
                    display_name = "一个转角"
                else:
                    display_name = to_name

                if i > 0 and turn == "直行" and to_name != result['end_name']:
                    merged_steps[-1]['distance'] += dist
                    # merged_steps[-1]['to_name'] = display_name
                else:
                    merged_steps.append({
                        "turn": turn,
                        "distance": dist,
                        "to_name": display_name,
                        "is_endpoint": to_name == result['end_name']
                    })
            
            step_descriptions = []
            for i, m in enumerate(merged_steps):
                if i == 0:
                    if m['turn'] == "出发" or m['turn'] == "直行":
                        action_text = f"直行"
                    else:
                        action_text = f"先{m['turn']}，走"
                        
                    if m['is_endpoint']:
                        desc = f"{action_text}大约{m['distance']:.0f}米，就直接到达{m['to_name']}了。"
                    else:
                        desc = f"{action_text}大约{m['distance']:.0f}米，到达{m['to_name']}。"
                else:
                    if m['is_endpoint']:
                        desc = f"然后{m['turn']}，走大约{m['distance']:.0f}米，就到达{m['to_name']}了。"
                    else:
                        desc = f"然后{m['turn']}，走大约{m['distance']:.0f}米，到达{m['to_name']}。"
                step_descriptions.append(desc)
            
            print(f"【{start_name} -> {end_name}】")
            path_nodes = [step['to_name'] for step in route['steps']]
            print(f"经过节点: {path_nodes}")
            print("播报: 从起点出发，" + " ".join(step_descriptions))
            print("-" * 50)

if __name__ == "__main__":
    test_all()