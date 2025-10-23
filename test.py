# import json
# import os
# import time
# from infrastructure.llm.llm_client import LLMClient

# INPUT_FILE = 'eval_test.json'
# OUTPUT_FILE = 'result.json'


# def build_evaluation_text(item: dict) -> str:
#     # 无论格式如何，直接将原始 item 作为评测输入传给 LLM
#     try:
#         return json.dumps(item, ensure_ascii=False, indent=2)
#     except Exception:
#         return str(item)


# def main():
#     if not os.path.exists(INPUT_FILE):
#         print(f"输入文件 {INPUT_FILE} 不存在，请创建并填入测试数据（数组格式）。")
#         return

#     with open(INPUT_FILE, 'r', encoding='utf-8') as f:
#         tests = json.load(f)

#     print(f"读取到 {len(tests)} 条测试项")

#     llm = LLMClient()
#     results = []

#     for idx, item in enumerate(tests):
#         title = item.get('title', f'测试任务-{idx}')
#         eval_text = build_evaluation_text(item)

#         # 如果拼接后为空，记录并跳过
#         if not eval_text or len(eval_text.strip()) == 0:
#             print(f"[{idx+1}/{len(tests)}] 跳过空输入: {title}")
#             results.append({
#                 'title': title,
#                 'duration_seconds': 0,
#                 'error': '空的评测输入，跳过'
#             })
#             continue

#         print(f"[{idx+1}/{len(tests)}] 开始生成报告：{title}")
#         start = time.time()
#         try:
#             report_struct = llm.judge_evaluation(eval_text)
#             # print(report_struct)
#             duration = time.time() - start

#             # 提取分数和建议
#             score = None
#             recommendations = []
#             if isinstance(report_struct, dict):
#                 scores = report_struct.get('scores', {})
#                 score = scores.get('total') if isinstance(scores, dict) else None
#                 suggestions = report_struct.get('suggestions', [])
#                 if isinstance(suggestions, list):
#                     for s in suggestions:
#                         if isinstance(s, dict) and 'suggestion' in s:
#                             recommendations.append(s['suggestion'])
#                         elif isinstance(s, str):
#                             recommendations.append(s)

#             results.append({
#                 'title': title,
#                 'duration_seconds': round(duration, 2),
#                 'report': report_struct,
#                 'score': score,
#                 'recommendations': recommendations
#             })
#             print(f"[{idx+1}] 完成，用时 {duration:.2f}s，得分: {score}")

#         except Exception as e:
#             duration = time.time() - start
#             print(f"[{idx+1}] 生成报告出错: {e}")
#             results.append({
#                 'title': title,
#                 'duration_seconds': round(duration, 2),
#                 'error': str(e)
#             })

#     with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
#         json.dump(results, f, ensure_ascii=False, indent=2)

#     print(f"完成。结果已写入 {OUTPUT_FILE}")


# if __name__ == '__main__':
#     main()

import json
import math
import statistics

def adjust_score(score):
    # 满分100，个位数（<10）则*10
    if score is None:
        return None
    if score <= 10:
        return score * 10
    return score

def main():
    # 读取结果和金标准
    with open('result.json', 'r', encoding='utf-8') as f:
        results = json.load(f)
    with open('eval_test.json', 'r', encoding='utf-8') as f:
        evals = json.load(f)

    # 统计 duration_seconds 平均值
    durations = [item['duration_seconds'] for item in results if 'duration_seconds' in item and isinstance(item['duration_seconds'], (int, float))]
    avg_duration = sum(durations) / len(durations) if durations else 0.0

    # 收集可用于评分比较的分数对（经过 adjust_score 处理）
    res_scores = []
    eval_scores = []
    skipped = 0
    for idx, (res, eva) in enumerate(zip(results, evals)):
        res_raw = res.get('score')
        eval_raw = eva.get('golden_label', {}).get('scores', {}).get('total')
        r = adjust_score(res_raw)
        e = adjust_score(eval_raw)
        if r is None or e is None:
            skipped += 1
            continue
        res_scores.append(float(r))
        eval_scores.append(float(e))

    n = len(res_scores)

    # 计算误差指标
    if n > 0:
        abs_diffs = [abs(r - e) for r, e in zip(res_scores, eval_scores)]
        mae = sum(abs_diffs) / n
        rmse = math.sqrt(sum((r - e) ** 2 for r, e in zip(res_scores, eval_scores)) / n)

        # Pearson 相关系数（使用总体标准差）
        if n >= 2:
            mean_r = statistics.mean(res_scores)
            mean_e = statistics.mean(eval_scores)
            cov = sum((r - mean_r) * (e - mean_e) for r, e in zip(res_scores, eval_scores)) / n
            std_r = statistics.pstdev(res_scores)
            std_e = statistics.pstdev(eval_scores)
            pearson = cov / (std_r * std_e) if std_r > 0 and std_e > 0 else 0.0
        else:
            pearson = None

        # 基于阈值 tau=5 的正确率（|result-eval| <= tau 视为正确）
        tau = 5.0
        correct_count = sum(1 for r, e in zip(res_scores, eval_scores) if abs(r - e) <= tau)
        accuracy = correct_count / n
    else:
        mae = rmse = pearson = accuracy = None

    # 输出结果统计
    print(f"样本总数 (可比较): {n}, 跳过样本: {skipped}")
    print(f"平均用时: {avg_duration:.2f} 秒")
    if mae is not None:
        print(f"MAE (平均绝对误差): {mae:.3f} 分")
        print(f"RMSE (均方根误差): {rmse:.3f} 分")
        if pearson is not None:
            print(f"Pearson 相关系数: {pearson:.4f}")
        else:
            print("Pearson 相关系数: 样本量不足（需要至少2个样本）")
        print(f"阈值 tau=5 分 的正确率: {accuracy:.3%} ({correct_count}/{n})")
    else:
        print("没有可比较的分数对，无法计算误差指标。")


if __name__ == '__main__':
    main()

# import json
# import os
# import time
# from infrastructure.llm.llm_client import LLMClient

# INPUT_FILE = 'eval_test.json'
# OUTPUT_FILE = 'result.json'


# def build_evaluation_text(item: dict) -> str:
#     # 无论格式如何，直接将原始 item 作为评测输入传给 LLM
#     try:
#         return json.dumps(item, ensure_ascii=False, indent=2)
#     except Exception:
#         return str(item)


# def main():
#     if not os.path.exists(INPUT_FILE):
#         print(f"输入文件 {INPUT_FILE} 不存在，请创建并填入测试数据（数组格式）。")
#         return

#     with open(INPUT_FILE, 'r', encoding='utf-8') as f:
#         tests = json.load(f)

#     print(f"读取到 {len(tests)} 条测试项")

#     llm = LLMClient()
#     results = []

#     for idx, item in enumerate(tests):
#         title = item.get('title', f'测试任务-{idx}')
#         eval_text = build_evaluation_text(item)

#         # 如果拼接后为空，记录并跳过
#         if not eval_text or len(eval_text.strip()) == 0:
#             print(f"[{idx+1}/{len(tests)}] 跳过空输入: {title}")
#             results.append({
#                 'title': title,
#                 'duration_seconds': 0,
#                 'error': '空的评测输入，跳过'
#             })
#             continue

#         print(f"[{idx+1}/{len(tests)}] 开始生成报告：{title}")
#         start = time.time()
#         try:
#             report_struct = llm.judge_evaluation(eval_text)
#             # print(report_struct)
#             duration = time.time() - start

#             # 提取分数和建议
#             score = None
#             recommendations = []
#             if isinstance(report_struct, dict):
#                 scores = report_struct.get('scores', {})
#                 score = scores.get('total') if isinstance(scores, dict) else None
#                 suggestions = report_struct.get('suggestions', [])
#                 if isinstance(suggestions, list):
#                     for s in suggestions:
#                         if isinstance(s, dict) and 'suggestion' in s:
#                             recommendations.append(s['suggestion'])
#                         elif isinstance(s, str):
#                             recommendations.append(s)

#             results.append({
#                 'title': title,
#                 'duration_seconds': round(duration, 2),
#                 'report': report_struct,
#                 'score': score,
#                 'recommendations': recommendations
#             })
#             print(f"[{idx+1}] 完成，用时 {duration:.2f}s，得分: {score}")

#         except Exception as e:
#             duration = time.time() - start
#             print(f"[{idx+1}] 生成报告出错: {e}")
#             results.append({
#                 'title': title,
#                 'duration_seconds': round(duration, 2),
#                 'error': str(e)
#             })

#     with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
#         json.dump(results, f, ensure_ascii=False, indent=2)

#     print(f"完成。结果已写入 {OUTPUT_FILE}")


# if __name__ == '__main__':
#     main()