from pydantic import BaseModel
from typing import Optional, Dict, List


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

"""
SCHEMAS FOR EXCEL FILE UPLOAD
"""
class ExcelUploadResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    dome_counts: Optional[Dict[str, int]] = None
    total_plants: Optional[int] = None
    domes: Optional[List[str]] = None

class ExcelStatisticsResponse(BaseModel):
    is_loaded: bool
    message: Optional[str] = None
    domes: Optional[Dict[str, Dict]] = None
    total_plants: Optional[int] = None

class PlantDataResponse(BaseModel):
    success: bool
    plant: Optional[Dict] = None
    error: Optional[str] = None

class PlantSearchResponse(BaseModel):
    success: bool
    plants: List[Dict]
    count: int