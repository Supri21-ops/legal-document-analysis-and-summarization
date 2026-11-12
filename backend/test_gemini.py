import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import errors

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=api_key)

models_to_try = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
]

for model in models_to_try:
    try:
        print(f"Testing model: {model}")

        response = client.models.generate_content(
            model=model,
            contents="Explain what a legal contract is in simple words."
        )

        print("\nGemini response:")
        print(response.text)
        break

    except errors.APIError as e:
        print(f"Model {model} failed: {e}")
        if model == models_to_try[-1]:
            raise
        time.sleep(2)