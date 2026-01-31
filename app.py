import os
import json
import re
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

# Database Setup
DB_NAME = "marketmind.db"

def init_db():
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tool_type TEXT NOT NULL,
                input_summary TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    except Exception as e:
        print(f"DB Init Error: {e}")
    finally:
        if conn: conn.close()

init_db()

def log_activity(tool_type, summary):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO activity_log (tool_type, input_summary) VALUES (?, ?)", (tool_type, summary))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Logging Error: {e}")

@app.route('/dashboard_stats')
def dashboard_stats():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Total Counts
        c.execute("SELECT COUNT(*) FROM activity_log")
        total_generated = c.fetchone()[0]
        
        # Tool Usage Breakdown
        c.execute("SELECT tool_type, COUNT(*) as count FROM activity_log GROUP BY tool_type")
        usage_data = {row['tool_type']: row['count'] for row in c.fetchall()}
        
        # Recent Activity
        c.execute("SELECT tool_type, input_summary, timestamp FROM activity_log ORDER BY id DESC LIMIT 5")
        recent_activity = [dict(row) for row in c.fetchall()]
        
        conn.close()
        
        return jsonify({
            "total_generated": total_generated,
            "usage_breakdown": usage_data,
            "recent_activity": recent_activity
        })
    except Exception as e:
        return jsonify({"error": str(e)})

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")

# Debugging: Print key status (masked)
if groq_api_key:
    groq_api_key = groq_api_key.strip()
    print(f"DEBUG: API Key loaded. Length: {len(groq_api_key)}")
    if len(groq_api_key) > 10:
        print(f"DEBUG: Key starts with: {groq_api_key[:5]}...")
else:
    print("ERROR: GROQ_API_KEY is missing or empty.")

client = Groq(api_key=groq_api_key)

MODEL = "llama-3.3-70b-versatile"

def get_groq_completion(prompt):
    """
    Helper function to call Groq API and return parsed JSON.
    """
    try:
        if not groq_api_key:
             return {"error": "GROQ_API_KEY not found in environment variables."}

        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful AI assistant for a marketing platform. You must output ONLY valid JSON. Do not include markdown formatting like ```json or ```. Ensure the JSON is well-formed."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stop=None,
            stream=False
        )
        
        content = completion.choices[0].message.content
        
        # Strip markdown code blocks if present (just in case)
        content = re.sub(r'^```json\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'^```\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'\s*```$', '', content, flags=re.MULTILINE)
        
        return json.loads(content)
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {"error": str(e)}

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/dashboard')
def dashboard():
    return render_template('index.html')

@app.route('/generate_campaign', methods=['POST'])
def generate_campaign():
    data = request.json
    product = data.get('product')
    audience = data.get('audience')
    platform = data.get('platform')
    goal = data.get('goal', 'General Awareness')
    tone = data.get('tone', 'Professional')
    
    prompt = f"""
    Create a marketing campaign via Groq for:
    Product: {product}
    Target Audience: {audience}
    Platform: {platform}
    Goal: {goal}
    Tone: {tone}
    
    If Platform is 'Any', choose the best one.
    
    Return a JSON object with strictly these keys:
    "Strategy Overview": "A brief 2-sentence strategy summary explaining the approach.",
    "Recommended Platform": "The chosen platform and why.",
    "Content Ideas": [list of 3 creative ideas specific to the platform],
    "Ad Copy Variations": [list of 3 ad copy texts matching the tone],
    "CTA Suggestions": [list of 3 calls to action]
    """
    
    result = get_groq_completion(prompt)
    if "error" not in result:
        log_activity("Campaign", f"{product} ({goal})")
    return jsonify(result)

@app.route('/generate_pitch', methods=['POST'])
def generate_pitch():
    data = request.json
    product = data.get('product')
    persona = data.get('customer_persona')
    pain_points = data.get('pain_points', 'General efficiency')
    fmt = data.get('format', 'Elevator Pitch')
    
    prompt = f"""
    Create a sales pitch for:
    Product: {product}
    Customer Persona: {persona}
    Key Pain Points to Solve: {pain_points}
    Format: {fmt}
    
    Return a JSON object with strictly these keys:
    "Pitch Content": "The actual script/email content formatted for {fmt}.",
    "Why It Works": "Explanation of the psychological triggers used.",
    "Key Differentiators": [list of 3 unique selling points],
    "Handling Objections": [list of 2 potential objections and 1-sentence rebuttals]
    """
    
    result = get_groq_completion(prompt)
    if "error" not in result:
        log_activity("Pitch", f"{product} - {fmt}")
    return jsonify(result)

@app.route('/lead_score', methods=['POST'])
def lead_score():
    data = request.json
    name = data.get('name')
    budget = data.get('budget')
    need = data.get('need')
    urgency = data.get('urgency')
    
    prompt = f"""
    Score this lead based on the following details:
    Name: {name}
    Budget: {budget}
    Need: {need}
    Urgency: {urgency}
    
    Return a JSON object with strictly these keys:
    "Score": number (0-100),
    "Reasoning": "string explanation",
    "Conversion Probability": "string (e.g., High, Medium, Low)"
    """
    
    result = get_groq_completion(prompt)
    if "error" not in result:
        log_activity("Lead Score", f"{name} (${budget})")
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
