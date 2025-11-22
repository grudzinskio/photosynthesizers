from pydantic import BaseModel
from typing import Optional


"""
SCHEMAS FOR SUMMARIZING A PLANT 
"""

class SummaryRequest(BaseModel):
    plant_name: Optional[str] = None

class SummaryResponse(BaseModel):
    plant_name: str
    summary: str
    success: bool

"""
SCHEMAS FOR ANSWERING A PLANT FOLLOW UP QUESTION
"""
class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    success: bool