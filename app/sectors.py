# app/sectors.py
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import File, UploadFile

# ------------------- FastAPI App -------------------
app = FastAPI(title="Sector Lookup API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"]
)

# ------------------- Load Dataset -------------------
data_path = Path(__file__).resolve().parent.parent / "data" / "sectors_info.csv"

try:
    df_sectors = pd.read_csv(data_path)
except FileNotFoundError:
    df_sectors = pd.DataFrame()  # empty DataFrame if CSV not found

# Create list of sector names for autocomplete
sector_names_list = sorted(df_sectors['sector_name'].tolist()) if not df_sectors.empty else []

# ------------------- Response Model -------------------
class SectorInfo(BaseModel):
    sector_id: int
    sector_name: str
    sector_radius_km: int
    parent_sector_id: Optional[float]

# ------------------- Root Endpoint Update -------------------
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
        <head><title>Sector Lookup API</title></head>
        <body>
            <h2>Sector Lookup API is running!</h2>
            <p>Available endpoints:</p>
            
            <h3>General:</h3>
            <ul>
                <li>/health - Check API health</li>
            </ul>

            <h3>Read / Search Sectors:</h3>
            <ul>
                <li>/sectors - List all sectors</li>
                <li>/sectors/id/{sector_id} - Get sector by ID</li>
                <li>/search_sectors/?query=&lt;letters&gt; - Autocomplete sectors by name</li>
                <li>/sectors/name/{sector_name} - Search sector by name</li>
            </ul>

            <h3>Add / Upload Sectors:</h3>
            <ul>
                <li>/sectors/add - <strong>POST</strong> endpoint to add a new sector (send JSON)</li>
                <li>/sectors/upload_csv - <strong>POST</strong> endpoint to upload your own CSV file</li>
            </ul>

            <h4>Example JSON for POST /sectors/add:</h4>
            <pre>
{
  "sector_id": 183,
  "sector_name": "Quantum Computing",
  "sector_radius_km": 25,
  "parent_sector_id": 0.0
}
            </pre>

            <h4>CSV upload instructions:</h4>
            <p>Use POST /sectors/upload_csv with a CSV file containing these columns:</p>
            <pre>
sector_id,sector_name,sector_radius_km,parent_sector_id
            </pre>
        </body>
    </html>
    """


# ------------------- Health Check -------------------
@app.get("/health")
def health_check():
    if df_sectors.empty:
        return {"status": "error", "message": "Dataset not loaded!"}
    return {
        "status": "ok",
        "message": "API is healthy and dataset loaded",
        "num_sectors": len(df_sectors)
    }

# ------------------- List All Sectors -------------------
@app.get("/sectors", response_model=List[SectorInfo])
def get_all_sectors():
    if df_sectors.empty:
        raise HTTPException(status_code=404, detail="No sectors found")
    return df_sectors.to_dict(orient="records")

# ------------------- Get Sector by ID -------------------
@app.get("/sectors/id/{sector_id}", response_model=SectorInfo)
def get_sector_by_id(sector_id: int):
    sector = df_sectors[df_sectors["sector_id"] == sector_id]
    if sector.empty:
        raise HTTPException(status_code=404, detail="Sector ID not found")
    return sector.iloc[0].to_dict()

# ------------------- Search / Autocomplete Sectors -------------------
@app.get("/search_sectors/")
def search_sectors(query: str = Query(..., min_length=1), limit: int = 20):
    """
    Autocomplete: return sectors containing the query string (case-insensitive)
    """
    if df_sectors.empty:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    
    query_lower = query.lower()
    matches = [name for name in sector_names_list if query_lower in name.lower()]
    matches = matches[:limit]
    
    return {"query": query, "results": matches, "total_matches": len(matches)}

# ------------------- Get Sector by Name -------------------
@app.get("/sectors/name/{sector_name}", response_model=List[SectorInfo])
def get_sector_by_name(sector_name: str):
    result = df_sectors[df_sectors["sector_name"].str.contains(sector_name, case=False)]
    if result.empty:
        raise HTTPException(status_code=404, detail="Sector name not found")
    return result.to_dict(orient="records")

from fastapi import Body

# ------------------- Add New Sector Endpoint -------------------
@app.post("/sectors/add", response_model=SectorInfo)
def add_sector(new_sector: SectorInfo = Body(...)):
    """
    Add a new sector to the dataset.
    """
    global df_sectors, sector_names_list  # modify global DataFrame

    if df_sectors.empty:
        # Create DataFrame with correct columns if empty
        df_sectors = pd.DataFrame(columns=new_sector.dict().keys())

    # Check if sector_id or sector_name already exists
    if not df_sectors[df_sectors['sector_id'] == new_sector.sector_id].empty:
        raise HTTPException(status_code=400, detail="Sector ID already exists")
    
    if not df_sectors[df_sectors['sector_name'].str.lower() == new_sector.sector_name.lower()].empty:
        raise HTTPException(status_code=400, detail="Sector name already exists")

    # Append new sector
    df_sectors = pd.concat([df_sectors, pd.DataFrame([new_sector.dict()])], ignore_index=True)

    # Save updated dataset to CSV
    try:
        df_sectors.to_csv(data_path, index=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save to CSV: {e}")

    # Update autocomplete list
    sector_names_list.append(new_sector.sector_name)
    sector_names_list.sort()

    return new_sector

# ------------------- Upload Sectors CSV Endpoint -------------------
@app.post("/sectors/upload_csv")
async def upload_sectors_csv(file: UploadFile = File(...)):
    """
    Upload a new CSV file to replace the current sectors dataset.
    The CSV must have the following columns:
    ['sector_id','sector_name','sector_radius_km','parent_sector_id']
    """
    global df_sectors, sector_names_list

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        contents = await file.read()
        df_new = pd.read_csv(pd.io.common.BytesIO(contents))

        # Check required columns
        required_columns = ['sector_id','sector_name','sector_radius_km','parent_sector_id']
        missing_cols = [c for c in required_columns if c not in df_new.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns in CSV: {missing_cols}")

        # Replace current dataset
        df_sectors = df_new

        # Update autocomplete list
        sector_names_list = sorted(df_sectors['sector_name'].tolist())

        # Save CSV to disk
        df_sectors.to_csv(data_path, index=False)

        return {"status": "success", "message": f"{len(df_sectors)} sectors loaded from uploaded CSV"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {e}")