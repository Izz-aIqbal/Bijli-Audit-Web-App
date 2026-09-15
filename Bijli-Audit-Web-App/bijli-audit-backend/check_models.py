from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

print("--- Active Models for Your API Key ---")
try:
    for model in client.models.list():
        # Prints model names like gemini-2.5-flash, gemini-2.0-flash, etc.
        print(model.name)
except Exception as e:
    print(f"Error fetching models: {e}")