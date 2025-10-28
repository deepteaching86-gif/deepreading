"""
List available Gemini models
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key: {api_key[:10]}...{api_key[-10:]}")

genai.configure(api_key=api_key)

print("\nAvailable Models:")
print("="*60)

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"\nModel: {model.name}")
            print(f"  Display Name: {model.display_name}")
            print(f"  Description: {model.description[:100]}...")
            print(f"  Supported Methods: {model.supported_generation_methods}")
except Exception as e:
    print(f"Error listing models: {e}")
