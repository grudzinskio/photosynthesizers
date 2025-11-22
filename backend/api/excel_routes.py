from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from api.schemas import (
    ExcelUploadResponse, 
    ExcelStatisticsResponse, 
    PlantDataResponse, 
    PlantSearchResponse
)
from game_utils.excel_loader_service import ExcelLoaderService

# Create router
router = APIRouter(prefix="/api/excel", tags=["excel-loader"])

# Initialize the Excel loader service (singleton pattern)
excel_loader = ExcelLoaderService()


@router.post("/upload", response_model=ExcelUploadResponse)
async def upload_excel_file(file: UploadFile = File(...)):
    """
    Upload and parse an Excel file containing plant data.
    The file will be parsed into dome-specific dataframes stored in memory.
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="File must be an Excel file (.xlsx or .xls)"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Load and parse the Excel file
        result = excel_loader.load_excel_file(file_content)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to load Excel file")
            )
        
        return ExcelUploadResponse(
            success=True,
            message=result.get("message"),
            dome_counts=result.get("dome_counts"),
            total_plants=result.get("total_plants"),
            domes=result.get("domes")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing Excel file: {str(e)}"
        )


@router.get("/statistics", response_model=ExcelStatisticsResponse)
async def get_excel_statistics():
    """
    Get statistics about the currently loaded Excel data.
    """
    try:
        stats = excel_loader.get_statistics()
        return ExcelStatisticsResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting statistics: {str(e)}"
        )


@router.get("/domes")
async def get_available_domes():
    """
    Get list of all available dome names from the loaded Excel file.
    """
    try:
        if not excel_loader.is_loaded:
            raise HTTPException(
                status_code=404,
                detail="No Excel file loaded. Please upload an Excel file first."
            )
        
        domes = excel_loader.get_all_domes()
        return {
            "success": True,
            "domes": domes,
            "count": len(domes)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting domes: {str(e)}"
        )


@router.get("/plants/{dome_name}")
async def get_plants_by_dome(
    dome_name: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0)
):
    """
    Get plants from a specific dome.
    
    Args:
        dome_name: Name of the dome (e.g., "Tropical Dome", "Desert Dome", "All")
        limit: Maximum number of plants to return
        offset: Number of plants to skip
    """
    try:
        if not excel_loader.is_loaded:
            raise HTTPException(
                status_code=404,
                detail="No Excel file loaded. Please upload an Excel file first."
            )
        
        df = excel_loader.get_dome_dataframe(dome_name)
        if df is None:
            raise HTTPException(
                status_code=404,
                detail=f"Dome '{dome_name}' not found. Available domes: {excel_loader.get_all_domes()}"
            )
        
        # Apply pagination
        paginated_df = df.iloc[offset:offset + limit]
        plants = paginated_df.to_dict('records')
        
        return {
            "success": True,
            "dome": dome_name,
            "plants": plants,
            "count": len(plants),
            "total": len(df),
            "limit": limit,
            "offset": offset
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting plants: {str(e)}"
        )


@router.get("/plant/{dome_name}/{index}", response_model=PlantDataResponse)
async def get_plant_by_index(dome_name: str, index: int):
    """
    Get a specific plant by its index in a dome dataframe.
    
    Args:
        dome_name: Name of the dome
        index: Index of the plant in the dataframe
    """
    try:
        if not excel_loader.is_loaded:
            raise HTTPException(
                status_code=404,
                detail="No Excel file loaded. Please upload an Excel file first."
            )
        
        plant = excel_loader.get_plant_by_index(dome_name, index)
        if plant is None:
            raise HTTPException(
                status_code=404,
                detail=f"Plant with index {index} not found in dome '{dome_name}'"
            )
        
        return PlantDataResponse(
            success=True,
            plant=plant
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting plant: {str(e)}"
        )


@router.get("/search/{dome_name}", response_model=PlantSearchResponse)
async def search_plants(
    dome_name: str,
    q: str = Query(..., description="Search term"),
    search_in: str = Query(default="Common Name,Scientific Name", description="Comma-separated list of columns to search in")
):
    """
    Search for plants in a specific dome.
    
    Args:
        dome_name: Name of the dome to search in
        q: Search term
        search_in: Comma-separated list of column names to search in (default: "Common Name,Scientific Name")
    """
    try:
        if not excel_loader.is_loaded:
            raise HTTPException(
                status_code=404,
                detail="No Excel file loaded. Please upload an Excel file first."
            )
        
        # Parse search_in parameter
        search_columns = [col.strip() for col in search_in.split(",")]
        
        plants = excel_loader.search_plants(dome_name, q, search_columns)
        
        return PlantSearchResponse(
            success=True,
            plants=plants,
            count=len(plants)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching plants: {str(e)}"
        )

