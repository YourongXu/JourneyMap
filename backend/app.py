import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import uuid
import json
from flask_cors import CORS

load_dotenv() # 加载 .env 文件中的环境变量

app = Flask(__name__)
# 最大权限CORS配置，开发环境用
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers="*", methods=["GET", "POST", "OPTIONS"])

# 打印所有请求日志，方便排查
@app.before_request
def log_request_info():
    print(f"[REQ] {request.method} {request.url} Headers: {dict(request.headers)}")

# 配置 Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=GEMINI_API_KEY)

# 简单的内存存储，用于"一次性"分析
# 当Flask应用重启时，这些数据会丢失，符合你"不用储存数据"的需求
analysis_results = {}
interview_data = {}

def get_gemini_response(prompt, model_name="gemini-1.5-flash"):
    """
    调用 Gemini API 获取回复
    """
    print(f"DEBUG: Using Gemini model: {model_name}")
    model = genai.GenerativeModel(model_name)
    try:
        response = model.generate_content(prompt)
        print(f"DEBUG: Gemini response: {response.text}")
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return None

@app.route('/api/analyze', methods=['POST'])
def analyze_interview():
    data = request.json
    raw_text = data.get('raw_text')
    title = data.get('title', 'Untitled Interview') # 默认标题

    if not raw_text:
        return jsonify({"error": "No raw_text provided"}), 400

    interview_id = str(uuid.uuid4())
    analysis_id = str(uuid.uuid4())

    # 存储原始访谈数据 (内存中)
    interview_data[interview_id] = {
        "interview_id": interview_id,
        "title": title,
        "raw_text": raw_text,
        "timestamp": "..." # 占位符，可以放实际时间戳
    }

    # ----- 构建 Gemini 提示词 (Prompt Engineering 是关键！) -----
    # 这一步非常重要，需要精心设计提示词，以引导Gemini生成你想要的结果。
    # 以下是一些建议，你可以根据实际测试不断优化。

    # 1. 提炼用户问题和关键词句
    problem_keyword_prompt = f"""
    请从以下用户访谈文本中，提炼出核心的用户问题和重要的关键词句。
    输出格式：
    用户问题：
    - [问题1]
    - [问题2]
    ...
    关键词句：
    - [关键词句1]
    - [关键词句2]
    ...

    访谈文本：
    {raw_text}
    """
    problem_keyword_response = get_gemini_response(problem_keyword_prompt)

    # 2. 情绪波动分析 (更复杂，可能需要更精细的提示词或分段分析)
    sentiment_prompt = f"""
    请分析以下用户访谈文本的整体情绪倾向（积极/消极/中立），并指出文本中关键的情绪表达片段。
    输出格式：
    整体情绪：[积极/消极/中立]
    情绪片段：
    - [片段1] (情绪: [积极/消极/中立])
    - [片段2] (情绪: [积极/消极/中立])
    ...

    访谈文本：
    {raw_text}
    """
    sentiment_response = get_gemini_response(sentiment_prompt)


    # 3. 生成 Persona (改为JSON格式输出)
    persona_prompt = f"""
    请根据以下用户访谈文本，生成一个用户画像 (Persona)。
    请严格按照以下JSON格式输出，不要添加任何其他内容：

    {{
        "name": "[生成一个合适的姓名]",
        "title": "[职业角色或身份描述]",
        "age": "[年龄或年龄范围，如 '25-30' 或 '32']",
        "occupation": "[具体职业]",
        "location": "[居住地点]",
        "quote": "[基于访谈内容生成的一句具有代表性的话]",
        "background": "[背景描述，2-3句话]",
        "goals": [
            "[目标1]",
            "[目标2]",
            "[目标3]"
        ],
        "painPoints": [
            "[痛点1]",
            "[痛点2]",
            "[痛点3]"
        ],
        "interests": [
            "[兴趣1]",
            "[兴趣2]",
            "[兴趣3]"
        ]
    }}

    访谈文本：
    {raw_text}
    """
    persona_response = get_gemini_response(persona_prompt)


    # 4. 生成 Journey Map (简化版，可以分阶段描述)
    journey_map_prompt = f"""
    请根据以下用户访谈文本，生成一个用户旅程图 (Journey Map) 的关键阶段、用户行为、情绪、痛点和机会点。
    至少包含3-5个阶段。
    输出格式为Markdown，例如：
    ### 用户旅程图
    #### 阶段1: [阶段名称]
    - **用户行为**: [行为描述]
    - **情绪**: [积极/消极/中立]
    - **痛点**: [痛点描述]
    - **机会点**: [机会点描述]

    #### 阶段2: [阶段名称]
    - **用户行为**: [行为描述]
    - **情绪**: [积极/消极/中立]
    - **痛点**: [痛点描述]
    - **机会点**: [机会点描述]
    ...

    访谈文本：
    {raw_text}
    """
    journey_map_response = get_gemini_response(journey_map_prompt)


    # 聚合结果并进行简单的解析
    def parse_list_items(text, keyword_start_str):
        if text:
            # 找到关键词列表的开始位置
            start_index = text.find(keyword_start_str)
            if start_index == -1:
                return []

            # 找到下一个关键词列表的开始位置，或者文本末尾
            end_index = len(text)
            # 查找其他可能的关键词标题，例如 "关键词句：" 后可能跟着 "整体情绪："
            other_keywords = ["用户问题：", "关键词句："]
            for kw in other_keywords:
                if kw != keyword_start_str:
                    next_start_index = text.find(kw, start_index + len(keyword_start_str))
                    if next_start_index != -1 and next_start_index < end_index:
                        end_index = next_start_index

            relevant_text = text[start_index + len(keyword_start_str):end_index].strip()

            items = []
            for line in relevant_text.split('\n'):
                line = line.strip()
                if line.startswith('-'):
                    items.append(line[1:].strip())
            return items
        return []

    user_problems = parse_list_items(problem_keyword_response, "用户问题：")
    keywords = parse_list_items(problem_keyword_response, "关键词句：")

    overall_sentiment = "N/A"
    sentiment_segments = []
    if sentiment_response:
        lines = sentiment_response.split('\n')
        for line in lines:
            if "整体情绪：" in line:
                try:
                    overall_sentiment = line.split("整体情绪：")[1].strip()
                except IndexError:
                    pass
            elif "(情绪:" in line:
                try:
                    segment_start = line.find('"') + 1
                    segment_end = line.find('"', segment_start)
                    segment = line[segment_start:segment_end].strip()

                    emotion_start = line.find("(情绪:") + len("(情绪:")
                    emotion_end = line.find(")", emotion_start)
                    emotion = line[emotion_start:emotion_end].strip()

                    sentiment_segments.append({"segment": segment, "emotion": emotion})
                except (ValueError, IndexError):
                    pass

    # 解析JSON格式的persona数据
    persona_data = None
    if persona_response:
        try:
            # 尝试解析JSON
            import re
            # 提取JSON部分（去除可能的前后文本）
            json_match = re.search(r'\{.*\}', persona_response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                persona_data = json.loads(json_str)
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Failed to parse persona JSON: {e}")
            # 如果JSON解析失败，保留原始文本
            persona_data = None

    # 将分析结果存储到内存字典中
    analysis_results[analysis_id] = {
        "analysis_id": analysis_id,
        "interview_id": interview_id,
        "raw_text": raw_text, # 存储原始文本以便回溯
        # 存储Gemini原始回复，方便调试和前端直接渲染Markdown
        "user_problems_raw": problem_keyword_response, 
        "keywords_raw": problem_keyword_response, 
        "sentiment_raw": sentiment_response, 
        "persona_raw": persona_response, 
        "journey_map_raw": journey_map_response, 
        "parsed_data": { # 尝试解析部分数据供结构化展示
            "user_problems": user_problems,
            "keywords": keywords,
            "overall_sentiment": overall_sentiment,
            "sentiment_segments": sentiment_segments,
            "persona_md": persona_response if persona_response else "未能生成用户画像。", # 前端直接渲染Markdown
            "persona_data": persona_data, # 新增：结构化的persona数据
            "journey_map_md": journey_map_response if journey_map_response else "未能生成用户旅程图。" # 前端直接渲染Markdown
        },
        "analysis_timestamp": "..." # 可以添加实际时间戳，例如 datetime.now().isoformat()
    }

    return jsonify({"analysis_id": analysis_id}), 200

@app.route('/api/analysis/<analysis_id>', methods=['GET'])
def get_analysis_result(analysis_id):
    result = analysis_results.get(analysis_id)
    if not result:
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify(result), 200

@app.route('/api/interviews', methods=['GET'])
def get_all_interviews():
    # 由于是"一次性"应用，这个接口在大部分情况下会返回空列表
    # 但我们仍然保留它，以防万一你希望在单次会话中显示历史记录
    interview_list = []
    for analysis_id, result in analysis_results.items():
        interview_list.append({
            "analysis_id": analysis_id,
            "title": interview_data.get(result["interview_id"], {}).get("title", "Untitled"),
            "timestamp": result["analysis_timestamp"]
        })
    return jsonify(interview_list), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)