from pathlib import Path
import json
import math
import sqlite3

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from scipy.stats import ttest_rel, wilcoxon


ROOT = Path(r"e:/my-gulangyu/作品集成果")
DB_PATH = Path(r"e:/my-gulangyu/backend/gulangyu.db")
DATA_PATH = ROOT / "数据" / "paper_ab_final_sample.csv"
JSON_PATH = ROOT / "报告" / "paper_ab_statistics.json"
TXT_PATH = ROOT / "报告" / "paper_ab_statistics.txt"
SUMMARY_FIG_PATH = ROOT / "图表" / "paper_ab_summary.png"
HAZARD_FIG_PATH = ROOT / "图表" / "paper_ab_hazard_ratio.png"
PATH_FIG_PATH = ROOT / "图表" / "paper_ab_path_length.png"
TIME_FIG_PATH = ROOT / "图表" / "paper_ab_completion_time.png"


def load_sample():
    conn = sqlite3.connect(DB_PATH)
    query = """
        SELECT
            id,
            test_run_id,
            timestamp,
            client_source,
            group_a_count,
            group_b_count,
            group_a_hazard_triggers,
            group_b_hazard_triggers,
            group_a_hazard_rate,
            group_b_hazard_rate,
            group_a_avg_path_length,
            group_b_avg_path_length,
            group_a_avg_completion_time,
            group_b_avg_completion_time
        FROM ab_test_summaries
        WHERE
            client_source = 'unity'
            AND group_a_count >= 10
            AND group_b_count >= 10
            AND group_a_hazard_rate BETWEEN 0 AND 1
            AND group_b_hazard_rate BETWEEN 0 AND 1
        ORDER BY id ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    if df.empty:
        raise SystemExit("未找到满足论文口径的 A/B 样本。")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["hazard_ratio_diff"] = df["group_a_hazard_rate"] - df["group_b_hazard_rate"]
    df["path_length_diff"] = df["group_b_avg_path_length"] - df["group_a_avg_path_length"]
    df["completion_time_diff"] = df["group_b_avg_completion_time"] - df["group_a_avg_completion_time"]
    return df


def mean_sd(values):
    series = pd.Series(values, dtype="float64")
    mean_value = float(series.mean())
    sd_value = float(series.std(ddof=1)) if len(series) > 1 else 0.0
    return mean_value, sd_value


def cohen_dz(diff_values):
    series = pd.Series(diff_values, dtype="float64")
    sd_value = float(series.std(ddof=1)) if len(series) > 1 else 0.0
    if math.isclose(sd_value, 0.0):
        return float("inf")
    return float(series.mean() / sd_value)


def safe_float(value):
    if isinstance(value, float) and math.isinf(value):
        return "inf"
    return float(value)


def build_stats(df):
    a_h = df["group_a_hazard_rate"]
    b_h = df["group_b_hazard_rate"]
    a_p = df["group_a_avg_path_length"]
    b_p = df["group_b_avg_path_length"]
    a_t = df["group_a_avg_completion_time"]
    b_t = df["group_b_avg_completion_time"]

    hazard_w = wilcoxon(a_h, b_h, alternative="greater", method="auto")
    path_t = ttest_rel(b_p, a_p)
    time_t = ttest_rel(b_t, a_t)

    stats = {
        "sample_rule": {
            "client_source": "unity",
            "group_a_count_min": 10,
            "group_b_count_min": 10,
            "hazard_rate_range": [0, 1],
        },
        "selected_ids": df["id"].astype(int).tolist(),
        "selected_test_run_ids": df["test_run_id"].tolist(),
        "run_count": int(len(df)),
        "metrics": {
            "hazard_ratio": {
                "group_a_mean": mean_sd(a_h)[0],
                "group_a_sd": mean_sd(a_h)[1],
                "group_b_mean": mean_sd(b_h)[0],
                "group_b_sd": mean_sd(b_h)[1],
                "mean_difference": float((a_h - b_h).mean()),
                "wilcoxon_statistic": float(hazard_w.statistic),
                "p_value": float(hazard_w.pvalue),
                "cohen_dz": safe_float(cohen_dz(a_h - b_h)),
            },
            "path_length": {
                "group_a_mean": mean_sd(a_p)[0],
                "group_a_sd": mean_sd(a_p)[1],
                "group_b_mean": mean_sd(b_p)[0],
                "group_b_sd": mean_sd(b_p)[1],
                "mean_difference": float((b_p - a_p).mean()),
                "t_statistic": float(path_t.statistic),
                "p_value": float(path_t.pvalue),
                "cohen_dz": safe_float(cohen_dz(b_p - a_p)),
            },
            "completion_time": {
                "group_a_mean": mean_sd(a_t)[0],
                "group_a_sd": mean_sd(a_t)[1],
                "group_b_mean": mean_sd(b_t)[0],
                "group_b_sd": mean_sd(b_t)[1],
                "mean_difference": float((b_t - a_t).mean()),
                "t_statistic": float(time_t.statistic),
                "p_value": float(time_t.pvalue),
                "cohen_dz": safe_float(cohen_dz(b_t - a_t)),
            },
        },
    }
    return stats


def make_bar_panel(ax, values_a, values_b, label_a, label_b, ylabel, title, as_percent=False):
    mean_a, sd_a = mean_sd(values_a)
    mean_b, sd_b = mean_sd(values_b)
    display_a = mean_a * 100 if as_percent else mean_a
    display_b = mean_b * 100 if as_percent else mean_b
    display_sd_a = sd_a * 100 if as_percent else sd_a
    display_sd_b = sd_b * 100 if as_percent else sd_b
    x = [0, 1]
    colors = ["#ff6b81", "#2ed573"]
    ax.bar(x, [display_a, display_b], yerr=[display_sd_a, display_sd_b], capsize=8, color=colors, width=0.55)
    ax.set_xticks(x, [label_a, label_b])
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    if as_percent:
        ax.set_ylim(0, 110)
    for i, value in enumerate([display_a, display_b]):
        label = f"{value:.1f}%" if as_percent else f"{value:.2f}"
        ax.text(i, value + (2 if as_percent else max(display_sd_a, display_sd_b, 1) * 0.2), label, ha="center", va="bottom", fontsize=10)


def make_box_panel(ax, values_a, values_b, label_a, label_b, ylabel, title):
    box = ax.boxplot([values_a, values_b], tick_labels=[label_a, label_b], patch_artist=True, widths=0.55)
    colors = ["#ff6b81", "#2ed573"]
    for patch, color in zip(box["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    for median in box["medians"]:
        median.set_color("#111827")
        median.set_linewidth(2)
    ax.set_ylabel(ylabel)
    ax.set_title(title)


def render_figures(df):
    plt.rcParams["font.family"] = ["DejaVu Sans", "Arial"]
    plt.rcParams["axes.unicode_minus"] = False

    fig, axes = plt.subplots(1, 3, figsize=(16, 5.5))
    make_bar_panel(
        axes[0],
        df["group_a_hazard_rate"],
        df["group_b_hazard_rate"],
        "A Shortest",
        "B Safest",
        "Hazard-exposed agents (%)",
        "Hazard Exposure Ratio",
        as_percent=True,
    )
    make_box_panel(
        axes[1],
        df["group_a_avg_path_length"],
        df["group_b_avg_path_length"],
        "A Shortest",
        "B Safest",
        "Path length (m)",
        "Path Length Distribution",
    )
    make_box_panel(
        axes[2],
        df["group_a_avg_completion_time"],
        df["group_b_avg_completion_time"],
        "A Shortest",
        "B Safest",
        "Completion time (s)",
        "Completion Time Distribution",
    )
    fig.tight_layout()
    fig.savefig(SUMMARY_FIG_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    make_bar_panel(
        ax,
        df["group_a_hazard_rate"],
        df["group_b_hazard_rate"],
        "A Shortest",
        "B Safest",
        "Hazard-exposed agents (%)",
        "Hazard Exposure Ratio",
        as_percent=True,
    )
    fig.tight_layout()
    fig.savefig(HAZARD_FIG_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    make_box_panel(
        ax,
        df["group_a_avg_path_length"],
        df["group_b_avg_path_length"],
        "A Shortest",
        "B Safest",
        "Path length (m)",
        "Path Length Distribution",
    )
    fig.tight_layout()
    fig.savefig(PATH_FIG_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    make_box_panel(
        ax,
        df["group_a_avg_completion_time"],
        df["group_b_avg_completion_time"],
        "A Shortest",
        "B Safest",
        "Completion time (s)",
        "Completion Time Distribution",
    )
    fig.tight_layout()
    fig.savefig(TIME_FIG_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)


def write_outputs(df, stats):
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_FIG_PATH.parent.mkdir(parents=True, exist_ok=True)

    export_df = df.copy()
    export_df["timestamp"] = export_df["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")
    export_df.to_csv(DATA_PATH, index=False, encoding="utf-8-sig")

    with JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    hz = stats["metrics"]["hazard_ratio"]
    pl = stats["metrics"]["path_length"]
    tm = stats["metrics"]["completion_time"]
    text = "\n".join(
        [
            "鼓浪屿 A/B 论文统计摘要",
            f"样本筛选：client_source=unity, group_a_count>=10, group_b_count>=10, hazard_rate∈[0,1]",
            f"固定样本 IDs：{stats['selected_ids']}",
            f"固定样本 test_run_ids：{', '.join(stats['selected_test_run_ids'])}",
            f"有效轮次：{stats['run_count']}",
            "",
            "危险提示代理占比",
            f"A组: {hz['group_a_mean'] * 100:.2f}% ± {hz['group_a_sd'] * 100:.2f}%",
            f"B组: {hz['group_b_mean'] * 100:.2f}% ± {hz['group_b_sd'] * 100:.2f}%",
            f"均值差(A-B): {hz['mean_difference'] * 100:.2f} 个百分点",
            f"Wilcoxon p值: {hz['p_value']:.6f}",
            f"Cohen's dz: {hz['cohen_dz']}",
            "",
            "路径长度",
            f"A组: {pl['group_a_mean']:.2f} ± {pl['group_a_sd']:.2f} m",
            f"B组: {pl['group_b_mean']:.2f} ± {pl['group_b_sd']:.2f} m",
            f"均值差(B-A): {pl['mean_difference']:.2f} m",
            f"配对 t 检验 p值: {pl['p_value']:.6f}",
            f"Cohen's dz: {pl['cohen_dz']}",
            "",
            "完成时间",
            f"A组: {tm['group_a_mean']:.2f} ± {tm['group_a_sd']:.2f} s",
            f"B组: {tm['group_b_mean']:.2f} ± {tm['group_b_sd']:.2f} s",
            f"均值差(B-A): {tm['mean_difference']:.2f} s",
            f"配对 t 检验 p值: {tm['p_value']:.6f}",
            f"Cohen's dz: {tm['cohen_dz']}",
            "",
            "论文结论建议",
            f"B组将危险提示代理占比从 {hz['group_a_mean'] * 100:.1f}% 降至 {hz['group_b_mean'] * 100:.1f}%，同时带来 {pl['mean_difference']:.1f} m 的路径增长与 {tm['mean_difference']:.1f} s 的时间增加。",
        ]
    )
    TXT_PATH.write_text(text, encoding="utf-8")


def main():
    df = load_sample()
    stats = build_stats(df)
    write_outputs(df, stats)
    render_figures(df)
    print(f"sample_rows={len(df)}")
    print(f"sample_ids={stats['selected_ids']}")
    print(f"csv={DATA_PATH}")
    print(f"json={JSON_PATH}")
    print(f"txt={TXT_PATH}")
    print(f"summary_figure={SUMMARY_FIG_PATH}")
    print(f"hazard_figure={HAZARD_FIG_PATH}")
    print(f"path_figure={PATH_FIG_PATH}")
    print(f"time_figure={TIME_FIG_PATH}")


if __name__ == "__main__":
    main()
