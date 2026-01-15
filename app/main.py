import sys
import os
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from fastapi import Depends, Query
from sqlalchemy.orm import Session

# --- Add data folder to path so we can import data_structures.py ---
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))
from data_structures import Base, Company, CompanySector, Sector

# --- Database setup ---
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "database.sqlite")
engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# --- FastAPI app ---
app = FastAPI(title="Companies API")

# --- Pydantic models for API responses ---
class CompanyModel(BaseModel):
    cib_id: str
    company_name: str
    hq_country_id: Optional[str]
    operation: Optional[str]
    operation_date: Optional[date]

    model_config = ConfigDict(from_attributes=True)  # Pydantic v2 replacement for orm_mode

class SectorModel(BaseModel):
    sector_id: int
    sector_name: str
    sector_radius_km: Optional[float]
    parent_sector_id: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class CompanySectorModel(BaseModel):
    id: int
    cib_id: str
    sector_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Dependency to get DB session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Routes ---

@app.get("/")
def root():
    return {"message": "Welcome to the Companies API!"}

# Get all companies
@app.get("/companies/", response_model=List[CompanyModel])
def get_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Company).offset(skip).limit(limit).all()

# Get all sectors
@app.get("/sectors/", response_model=List[SectorModel])
def get_sectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Sector).offset(skip).limit(limit).all()

# Get all company-sector relationships
@app.get("/companies_sectors/", response_model=List[CompanySectorModel])
def get_company_sectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(CompanySector).offset(skip).limit(limit).all()

# ------------------- Search Companies by First Letter -------------------
@app.get("/companies_by_letter/", response_model=List[CompanyModel])
def companies_by_letter(
    letter: str = Query(..., min_length=1, max_length=1),
    limit: int = 20,
    db: Session = Depends(get_db)  # <- Use Depends here
):
    results = db.query(Company).filter(Company.company_name.ilike(f"{letter}%")).limit(limit).all()
    return results

# --- Run Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
