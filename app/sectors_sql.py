# app/sectors.py
from fastapi import FastAPI, HTTPException, Query, Body, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pandas as pd
import io
import ast

# ------------------- FastAPI App -------------------
app = FastAPI(title="Sector Lookup API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ------------------- Database Setup -------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./sectors.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# ------------------- SQLAlchemy Model -------------------
class Sector(Base):
    __tablename__ = "sectors"
    sector_id = Column(Integer, primary_key=True, index=True)
    sector_name = Column(String, unique=True, index=True)
    sector_radius_km = Column(Integer)
    parent_sector_id = Column(Integer, nullable=True)

Base.metadata.create_all(bind=engine)

# ------------------- Pydantic Model -------------------
class SectorInfo(BaseModel):
    sector_id: int
    sector_name: str
    sector_radius_km: int
    parent_sector_id: Optional[int] = 0

# ------------------- Root Endpoint -------------------
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
  "parent_sector_id": 0
}
            </pre>
        </body>
    </html>
    """

# ------------------- Health Endpoint -------------------
@app.get("/health")
def health_check():
    db = SessionLocal()
    count = db.query(Sector).count()
    db.close()
    return {"status": "ok", "num_sectors": count}

# ------------------- List All Sectors -------------------
@app.get("/sectors", response_model=List[SectorInfo])
def get_all_sectors():
    db = SessionLocal()
    sectors = db.query(Sector).all()
    db.close()
    if not sectors:
        raise HTTPException(status_code=404, detail="No sectors found")
    return [SectorInfo(**{
        "sector_id": s.sector_id,
        "sector_name": s.sector_name,
        "sector_radius_km": s.sector_radius_km,
        "parent_sector_id": s.parent_sector_id
    }) for s in sectors]

# ------------------- Get Sector by ID -------------------
@app.get("/sectors/id/{sector_id}", response_model=SectorInfo)
def get_sector_by_id(sector_id: int):
    db = SessionLocal()
    sector = db.query(Sector).filter(Sector.sector_id == sector_id).first()
    db.close()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector ID not found")
    return SectorInfo(**sector.__dict__)

# ------------------- Get Sector by Name -------------------
@app.get("/sectors/name/{sector_name}", response_model=List[SectorInfo])
def get_sector_by_name(sector_name: str):
    db = SessionLocal()
    sectors = db.query(Sector).filter(Sector.sector_name.ilike(f"%{sector_name}%")).all()
    db.close()
    if not sectors:
        raise HTTPException(status_code=404, detail="Sector name not found")
    return [SectorInfo(**s.__dict__) for s in sectors]

# ------------------- Search / Autocomplete Sectors -------------------
@app.get("/search_sectors/")
def search_sectors(query: str = Query(..., min_length=1), limit: int = 20):
    db = SessionLocal()
    sectors = db.query(Sector).filter(Sector.sector_name.ilike(f"%{query}%")).limit(limit).all()
    db.close()
    return {"query": query, "results": [s.sector_name for s in sectors], "total_matches": len(sectors)}

# ------------------- Add New Sector -------------------
@app.post("/sectors/add", response_model=SectorInfo)
def add_sector(new_sector: SectorInfo = Body(...)):
    db = SessionLocal()
    # Check duplicates
    if db.query(Sector).filter(Sector.sector_id == new_sector.sector_id).first():
        db.close()
        raise HTTPException(status_code=400, detail="Sector ID already exists")
    if db.query(Sector).filter(Sector.sector_name.ilike(new_sector.sector_name)).first():
        db.close()
        raise HTTPException(status_code=400, detail="Sector name already exists")
    
    sector = Sector(**new_sector.dict())
    db.add(sector)
    db.commit()
    db.refresh(sector)
    db.close()
    return new_sector

# ------------------- Upload CSV Endpoint -------------------
@app.post("/sectors/upload_csv")
async def upload_sectors_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    try:
        contents = await file.read()
        df_new = pd.read_csv(io.BytesIO(contents))
        required_columns = ['sector_id','sector_name','sector_radius_km','parent_sector_id']
        missing_cols = [c for c in required_columns if c not in df_new.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")
        
        # Replace DB contents
        db = SessionLocal()
        db.query(Sector).delete()
        db.commit()
        for _, row in df_new.iterrows():
            db.add(Sector(**row.to_dict()))
        db.commit()
        db.close()
        return {"status": "success", "num_sectors": len(df_new)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {e}")
