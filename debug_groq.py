import os
from dotenv import load_dotenv, find_dotenv
from groq import Groq

# Attempt to find and load .env
env_file = find_dotenv()
print(f"Debug: .env file found at: {env_file}")

load_dotenv(env_file, override=True)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("ERROR: GROQ_API_KEY not found in environment.")
else:
    # Print first few chars and length to debug hidden chars/whitespace
    print(f"DEBUG: API Key Loaded: '{api_key[:5]}...{api_key[-4:]}'")
    print(f"DEBUG: Key Length: {len(api_key)}")
    
    # Try a simple request
    try:
        client = Groq(api_key=api_key.strip()) 
        print("Attempting to connect to Groq...")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello",
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        print("SUCCESS! Groq API responded:")
        print(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"ERROR connecting to Groq: {e}")
