import sys
import os
from fastapi import FastAPI, HTTPException, Depends, Path
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

class CompanyUpdateModel(BaseModel):
    company_name: Optional[str]
    hq_country_id: Optional[str]
    operation: Optional[str]
    operation_date: Optional[date]

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

class SectorUpdateModel(BaseModel):
    sector_name: Optional[str]
    sector_radius_km: Optional[float]
    parent_sector_id: Optional[int]


class CompanyWithSectorModel(BaseModel):
    company: CompanyModel
    sector: SectorModel

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

@app.get("/company_info/{company_name}", response_model=CompanyWithSectorModel)
def get_company_info(company_name: str, db: Session = Depends(get_db)):
    # 1. Find the company by name
    company = db.query(Company).filter(Company.company_name == company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # 2. Find the company-sector relation
    company_info = db.query(CompanySector).filter(CompanySector.cib_id == company.cib_id).first()
    if not company_info:
        raise HTTPException(status_code=404, detail="Company sector relation not found")

    # 3. Find the sector
    sector = db.query(Sector).filter(Sector.sector_id == company_info.sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")

    # 4. Return combined result
    return CompanyWithSectorModel(company=company, sector=sector)

@app.put("/companies/{cib_id}/", response_model=CompanyModel)
def update_company(
    cib_id: str = Path(..., description="CIB ID of the company to update"),
    company_update: CompanyUpdateModel = ...,
    db: Session = Depends(get_db)
):
    # Fetch the company
    company = db.query(Company).filter(Company.cib_id == cib_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Update only the fields provided (Pydantic v2 uses model_dump)
    update_data = company_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


# Update a sector completely (PUT)
@app.put("/sectors/{sector_id}", response_model=SectorModel)
def update_sector(sector_id: int, sector_data: SectorModel, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.sector_id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    sector.sector_name = sector_data.sector_name
    sector.sector_radius_km = sector_data.sector_radius_km
    sector.parent_sector_id = sector_data.parent_sector_id

    db.commit()
    db.refresh(sector)
    return sector

# Update a sector partially (PATCH)
@app.patch("/sectors/{sector_id}", response_model=SectorModel)
def patch_sector(sector_id: int, sector_data: SectorUpdateModel, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.sector_id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    # Update only fields that are provided
    if sector_data.sector_name is not None:
        sector.sector_name = sector_data.sector_name
    if sector_data.sector_radius_km is not None:
        sector.sector_radius_km = sector_data.sector_radius_km
    if sector_data.parent_sector_id is not None:
        sector.parent_sector_id = sector_data.parent_sector_id

    db.commit()
    db.refresh(sector)
    return sector


# --- Run Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
