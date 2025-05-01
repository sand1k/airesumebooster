"""OpenAI client for resume analysis"""
import os
from typing import Optional
from openai import AsyncOpenAI, APIError
import PyPDF2
import io

client: Optional[AsyncOpenAI] = None

def init_openai():
    """Initialize OpenAI client with API key"""
    global client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    client = AsyncOpenAI(api_key=api_key)

async def analyze_resume(pdf_content: bytes) -> str:
    """
    Analyze a resume PDF and return improvement suggestions as markdown.
    
    Args:
        pdf_content: Raw PDF file content
        
    Returns:
        str: Improvement suggestions formatted as markdown
    """
    if not client:
        init_openai()
        
    # Extract text from PDF
    pdf_file = io.BytesIO(pdf_content)
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
        
    # Prepare prompt for GPT
    prompt = f"""Analyze this resume and provide detailed improvement suggestions. Format your response in markdown with clear sections and bullet points.
Focus on:
- Content and clarity
- Professional impact
- Skills presentation
- Layout and formatting
- Action verbs and quantification
- Overall effectiveness

Resume text:
{text}
"""
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional resume reviewer. Provide clear, actionable suggestions to improve resumes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
        
    except APIError as e:
        print(f"OpenAI API error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error analyzing resume: {str(e)}")
        raise 