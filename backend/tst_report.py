import argparse
import os
from evaluate_real_users import evaluate


def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=os.path.join(backend_dir, "real_user_samples.csv"))
    parser.add_argument("--score-threshold", type=float, default=0.85)
    args = parser.parse_args()
    evaluate(args.csv, args.score_threshold)


if __name__ == "__main__":
    main()
