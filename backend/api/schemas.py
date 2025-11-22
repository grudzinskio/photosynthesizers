import pydantic
from typing import Optional


"""
SCHEMAS FOR SUMMARIZING A PLANT 
"""

def SummaryRequest(BaseModel):
    plant_name: str

def SummaryResponse(BaseModel):
    plant_name: str
    summary: str
    success: bool

"""
SCHEMAS FOR ANSWERING A PLANT FOLLOW UP QUESTION
"""
def FollowUpRequest(BaseModel):
    question: str

def FollowUpResponse(BaseModel):
    answer: str
    success: bool

"""
SCHEMAS FOR VERIFYING A PLANT IMAGE
"""

def VerifyImageRequest(BaseModel):
    image: bytes
    filename: str

def VerifyImageResponse(BaseModel):
    success: bool
    error: Optional[str] = None

