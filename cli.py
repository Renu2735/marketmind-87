"""
MarketAI Suite - Command Line Interface
Run the application directly from command prompt
"""

import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def print_header():
    """Print application header"""
    print("\n" + "="*60)
    print("          MARKETAI SUITE - CLI VERSION")
    print("    AI-Powered Marketing Intelligence Platform")
    print("="*60 + "\n")

def print_menu():
    """Print main menu"""
    print("\n📋 MAIN MENU:")
    print("1. Generate Ad Campaign")
    print("2. Create Sales Pitch")
    print("3. Score Lead")
    print("4. View Saved Items")
    print("5. Exit")
    print("-" * 60)

def generate_campaign():
    """Generate marketing campaign"""
    print("\n🚀 AD CAMPAIGN GENERATOR\n")
    
    product = input("Product/Service: ")
    audience = input("Target Audience: ")
    
    print("\nPlatforms: Facebook, Instagram, Google, LinkedIn, Twitter, TikTok, Email, Any")
    platform = input("Platform: ")
    
    print("\nGoals: Brand Awareness, Lead Generation, Direct Sales, Engagement")
    goal = input("Campaign Goal: ")
    
    print("\nTones: Professional, Casual, Witty, Urgent/FOMO, Empathetic, Luxury")
    tone = input("Tone of Voice: ")
    
    print("\n⏳ Generating campaign... Please wait...\n")
    
    prompt = f"""Create a comprehensive marketing campaign for:
Product: {product}
Target Audience: {audience}
Platform: {platform}
Goal: {goal}
Tone: {tone}

Provide:
1. Campaign Strategy Overview
2. 3 Ad Copy Variations
3. Platform-Specific Recommendations
4. Key Messaging Points"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048
        )
        
        result = response.choices[0].message.content
        
        print("="*60)
        print("✅ CAMPAIGN GENERATED SUCCESSFULLY")
        print("="*60)
        print(result)
        print("="*60)
        
        # Save to file
        save_option = input("\n💾 Save this campaign? (y/n): ")
        if save_option.lower() == 'y':
            save_to_file('campaign', {
                'product': product,
                'audience': audience,
                'platform': platform,
                'goal': goal,
                'tone': tone,
                'result': result
            })
            print("✓ Campaign saved to 'saved_campaigns.json'")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def create_pitch():
    """Create sales pitch"""
    print("\n🎤 SALES PITCH CREATOR\n")
    
    product = input("Product/Service: ")
    audience = input("Target Audience: ")
    pain_points = input("Customer Pain Points: ")
    
    print("\nFormats: Elevator Pitch, Cold Email, LinkedIn DM, Cold Call Script")
    format_type = input("Pitch Format: ")
    
    print("\n⏳ Creating pitch... Please wait...\n")
    
    prompt = f"""Create a compelling sales pitch for:
Product: {product}
Target Audience: {audience}
Pain Points: {pain_points}
Format: {format_type}

Provide:
1. The actual pitch (formatted for {format_type})
2. Key psychological triggers used
3. Objection handling strategies"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048
        )
        
        result = response.choices[0].message.content
        
        print("="*60)
        print("✅ SALES PITCH CREATED SUCCESSFULLY")
        print("="*60)
        print(result)
        print("="*60)
        
        # Save to file
        save_option = input("\n💾 Save this pitch? (y/n): ")
        if save_option.lower() == 'y':
            save_to_file('pitch', {
                'product': product,
                'audience': audience,
                'pain_points': pain_points,
                'format': format_type,
                'result': result
            })
            print("✓ Pitch saved to 'saved_pitches.json'")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def score_lead():
    """Score a lead"""
    print("\n🎯 LEAD SCORING\n")
    
    name = input("Lead Name: ")
    company = input("Company: ")
    budget = input("Budget ($): ")
    engagement = input("Engagement Level (Low/Medium/High): ")
    industry = input("Industry: ")
    
    print("\n⏳ Analyzing lead... Please wait...\n")
    
    prompt = f"""Score this lead from 0-100:
Name: {name}
Company: {company}
Budget: ${budget}
Engagement: {engagement}
Industry: {industry}

Provide:
1. Overall Score (0-100)
2. Detailed Reasoning
3. Recommendations for next steps"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024
        )
        
        result = response.choices[0].message.content
        
        print("="*60)
        print("✅ LEAD SCORED SUCCESSFULLY")
        print("="*60)
        print(result)
        print("="*60)
        
        # Save to file
        save_option = input("\n💾 Save this lead score? (y/n): ")
        if save_option.lower() == 'y':
            save_to_file('lead', {
                'name': name,
                'company': company,
                'budget': budget,
                'engagement': engagement,
                'industry': industry,
                'result': result
            })
            print("✓ Lead score saved to 'saved_leads.json'")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def save_to_file(item_type, data):
    """Save data to JSON file"""
    filename = f'saved_{item_type}s.json'
    
    # Load existing data
    try:
        with open(filename, 'r') as f:
            saved_data = json.load(f)
    except FileNotFoundError:
        saved_data = []
    
    # Add new item
    saved_data.append(data)
    
    # Save back to file
    with open(filename, 'w') as f:
        json.dump(saved_data, f, indent=2)

def view_saved():
    """View saved items"""
    print("\n💾 SAVED ITEMS\n")
    print("1. View Campaigns")
    print("2. View Pitches")
    print("3. View Lead Scores")
    print("4. Back to Main Menu")
    
    choice = input("\nSelect option: ")
    
    if choice == '1':
        view_file('saved_campaigns.json', 'Campaigns')
    elif choice == '2':
        view_file('saved_pitches.json', 'Pitches')
    elif choice == '3':
        view_file('saved_leads.json', 'Lead Scores')

def view_file(filename, title):
    """View contents of a saved file"""
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        
        if not data:
            print(f"\n📭 No saved {title.lower()} found.")
            return
        
        print(f"\n{'='*60}")
        print(f"  SAVED {title.upper()} ({len(data)} items)")
        print(f"{'='*60}\n")
        
        for i, item in enumerate(data, 1):
            print(f"\n--- Item {i} ---")
            for key, value in item.items():
                if key != 'result':
                    print(f"{key.title()}: {value}")
            print("-" * 40)
        
        # Option to view full details
        view_detail = input("\nView full details of an item? (Enter number or 'n'): ")
        if view_detail.isdigit():
            idx = int(view_detail) - 1
            if 0 <= idx < len(data):
                print("\n" + "="*60)
                print(json.dumps(data[idx], indent=2))
                print("="*60)
    
    except FileNotFoundError:
        print(f"\n📭 No saved {title.lower()} found.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main application loop"""
    print_header()
    
    # Check API key
    if not os.getenv('GROQ_API_KEY'):
        print("❌ ERROR: GROQ_API_KEY not found in .env file")
        print("Please add your API key to the .env file and try again.")
        return
    
    print("✅ API Key loaded successfully")
    
    while True:
        print_menu()
        choice = input("\nSelect option (1-5): ")
        
        if choice == '1':
            generate_campaign()
        elif choice == '2':
            create_pitch()
        elif choice == '3':
            score_lead()
        elif choice == '4':
            view_saved()
        elif choice == '5':
            print("\n👋 Thank you for using MarketAI Suite!")
            print("="*60 + "\n")
            break
        else:
            print("\n❌ Invalid option. Please select 1-5.")

if __name__ == "__main__":
    main()
