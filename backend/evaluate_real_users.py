import csv
import os
import sys
import time
import argparse

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from main import match_place_index, PLACE_PINYIN


def predict_place(raw_text, places):
    best_place = None
    best_score = 0.0
    best_idx = -1
    for place in places:
        idx, score = match_place_index(place, raw_text)
        if idx == -1:
            continue
        if score > best_score or (score == best_score and (best_idx == -1 or idx < best_idx)):
            best_place = place
            best_score = score
            best_idx = idx
    return best_place, best_score, best_idx


def evaluate(csv_path, score_threshold):
    places = list(PLACE_PINYIN.keys())
    total = 0
    passed = 0
    latency_sum = 0.0
    bad_cases = []

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        required_fields = {"user_id", "raw_text", "target_place"}
        if not required_fields.issubset(set(reader.fieldnames or [])):
            missing = required_fields - set(reader.fieldnames or [])
            raise ValueError(f"CSV 缺少字段: {', '.join(sorted(missing))}")

        for row in reader:
            user_id = (row.get("user_id") or "").strip()
            raw_text = (row.get("raw_text") or "").strip()
            target_place = (row.get("target_place") or "").strip()
            if not raw_text or not target_place:
                continue

            total += 1
            t0 = time.perf_counter()
            predicted_place, score, pos = predict_place(raw_text, places)
            latency_ms = (time.perf_counter() - t0) * 1000
            latency_sum += latency_ms

            correct_place = predicted_place == target_place
            score_ok = score >= score_threshold
            success = correct_place and score_ok

            if success:
                passed += 1
            else:
                reason_parts = []
                if not correct_place:
                    reason_parts.append("地点匹配错误")
                if not score_ok:
                    reason_parts.append(f"得分低于阈值({score_threshold:.2f})")
                bad_cases.append({
                    "user_id": user_id,
                    "raw_text": raw_text,
                    "target_place": target_place,
                    "predicted_place": predicted_place,
                    "score": round(score, 4),
                    "position": pos,
                    "latency_ms": round(latency_ms, 2),
                    "reason": "、".join(reason_parts) if reason_parts else "未知"
                })

    accuracy = (passed / total * 100) if total else 0.0
    avg_latency = (latency_sum / total) if total else 0.0

    print("=== 真实用户样本评测报告 ===")
    print(f"样本总数: {total}")
    print(f"通过数: {passed}")
    print(f"准确率: {accuracy:.2f}%")
    print(f"平均耗时: {avg_latency:.2f} ms")
    print(f"阈值: score >= {score_threshold:.2f}")
    print("")
    print("=== Bad Cases ===")
    if not bad_cases:
        print("无")
    else:
        for i, case in enumerate(bad_cases, start=1):
            print(
                f"{i}. user_id={case['user_id']}, target={case['target_place']}, "
                f"pred={case['predicted_place']}, score={case['score']}, "
                f"latency_ms={case['latency_ms']}, reason={case['reason']}, text={case['raw_text']}"
            )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        default=os.path.join(backend_dir, "real_user_samples.csv"),
        help="真实用户样本 CSV 路径"
    )
    parser.add_argument(
        "--score-threshold",
        type=float,
        default=0.85,
        help="得分阈值，低于该值计入失败"
    )
    args = parser.parse_args()
    evaluate(args.csv, args.score_threshold)


if __name__ == "__main__":
    main()
