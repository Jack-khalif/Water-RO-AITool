import os
from dotenv import load_dotenv
import openai

load_dotenv('.env.local')
key = os.getenv("OPENAI_API_KEY")
print("Loaded OPENAI_API_KEY:", key)

try:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello."}
        ],
        temperature=0.0,
    )
    print("OpenAI API call succeeded!\nResponse:", response.choices[0].message.content)
except Exception as e:
    print("OpenAI API call failed!\nError:", e)
