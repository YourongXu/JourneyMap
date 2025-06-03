import os
import google.generativeai as genai
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv() 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found. Please check your .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Available models supporting generateContent:")
    try:
        for model in genai.list_models():
            if "generateContent" in model.supported_generation_methods:
                print(model.name)
    except Exception as e:
        print(f"Failed to list models: {e}")