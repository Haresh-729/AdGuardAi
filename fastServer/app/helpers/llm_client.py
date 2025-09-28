import os
import json
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def call_llm_gemini(prompt: str, system_message: str = "You are a helpful AI assistant.", max_tokens: int = 1000) -> str:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        full_prompt = f"{system_message}\n\n{prompt}"
        
        response = model.generate_content(
            full_prompt
        )
        
        # Clean response
        clean_response = response.text.replace("```json", "").replace("```", "").strip()
        print(f"LLM response: {clean_response}")
        return clean_response
        
    except Exception as e:
        print(f"LLM call failed: {e}")
        raise Exception(f"LLM analysis failed: {str(e)}")