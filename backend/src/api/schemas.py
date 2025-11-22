import pydantic
from typing import Optional

def PlantRequest(BaseModel):
    plant_name: str


def PlantResponse(BaseModel):
    plant_name: str
    summary: str
    success: bool

