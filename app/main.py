import os
from fastapi import FastAPI, HTTPException, Depends, Query
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from fastapi import Header

# --- Add data folder to path so we can import data_structures.py ---
from data.data_structures import Base, Company, CompanySector, Sector

# --- Database setup ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get("DB_PATH", os.path.join(PROJECT_ROOT, "data", "database.sqlite"))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# --- FastAPI app ---
app = FastAPI(title="Companies API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic models ---
class CompanyModel(BaseModel):
    cib_id: str
    company_name: str
    hq_country_id: Optional[str]
    operation: Optional[str]
    operation_date: Optional[date]

    model_config = ConfigDict(from_attributes=True)

class CompanyFullUpdateModel(BaseModel):
    company_name: Optional[str]
    hq_country_id: Optional[str]
    operation: Optional[str]
    operation_date: Optional[date]
    sector_id: Optional[int]

class CompanyCreateModel(BaseModel):
    cib_id: str
    company_name: str
    hq_country_id: Optional[str] = None
    operation: Optional[str] = None
    operation_date: Optional[date] = None
    sector_id: Optional[int] = None

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
    sector: Optional[SectorModel] 

    model_config = ConfigDict(from_attributes=True)

class SectorWithCompanyCountModel(BaseModel):
    sector_id: int
    sector_name: str
    company_count: int

    model_config = ConfigDict(from_attributes=True)

class SectorCreateModel(BaseModel):
    sector_name: str
    sector_radius_km: Optional[float] = None
    parent_sector_id: Optional[int] = None


# --- Dependency ---
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

@app.get("/companies/", response_model=List[CompanyModel])
def get_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Company).offset(skip).limit(limit).all()

@app.get("/sectors/", response_model=List[SectorModel])
def get_sectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Sector).offset(skip).limit(limit).all()

@app.get("/companies_sectors/", response_model=List[CompanySectorModel])
def get_company_sectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(CompanySector).offset(skip).limit(limit).all()

@app.get("/companies_by_letter/", response_model=List[CompanyModel])
def companies_by_letter(
    letter: str = Query(..., min_length=1, max_length=1),
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return db.query(Company).filter(Company.company_name.ilike(f"{letter}%")).limit(limit).all()

@app.get("/company_info/{company_name}", response_model=CompanyWithSectorModel)
def get_company_info(company_name: str, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.company_name == company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company_sector = db.query(CompanySector).filter(CompanySector.cib_id == company.cib_id).first()
    sector = db.query(Sector).filter(Sector.sector_id == company_sector.sector_id).first() if company_sector else None

    return CompanyWithSectorModel(company=company, sector=sector)

@app.get("/companies_with_sectors", response_model=List[CompanyWithSectorModel])
def get_companies_with_sectors(limit: int = 20, db: Session = Depends(get_db)):
    companies = db.query(Company).limit(limit).all()
    results = []
    for company in companies:
        company_sector = db.query(CompanySector).filter(CompanySector.cib_id == company.cib_id).first()
        sector = db.query(Sector).filter(Sector.sector_id == company_sector.sector_id).first() if company_sector else None
        results.append(CompanyWithSectorModel(company=company, sector=sector))
    return results

@app.patch("/update_company_full/{cib_id}", response_model=CompanyWithSectorModel)
def update_company_full(
    cib_id: str,
    update_data: CompanyFullUpdateModel,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.cib_id == cib_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    update_fields = update_data.model_dump(exclude_unset=True)
    for key in ['company_name', 'hq_country_id', 'operation', 'operation_date']:
        if key in update_fields:
            setattr(company, key, update_fields[key])

    if 'sector_id' in update_fields:
        company_sector = db.query(CompanySector).filter(CompanySector.cib_id == cib_id).first()
        if company_sector:
            company_sector.sector_id = update_fields['sector_id']
        else:
            db.add(CompanySector(cib_id=cib_id, sector_id=update_fields['sector_id']))

    db.commit()
    db.refresh(company)
    company_sector = db.query(CompanySector).filter(CompanySector.cib_id == cib_id).first()
    sector = db.query(Sector).filter(Sector.sector_id == company_sector.sector_id).first() if company_sector else None

    return CompanyWithSectorModel(company=company, sector=sector)

# This is "password" for the endpoint
ADD_COMPANY_PASSWORD = "supersecret123"

def verify_add_company_password(x_password: str = Header(...)):
    """
    Checks the X-Password header.
    Raises 401 if the password is wrong.
    """
    if x_password != ADD_COMPANY_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/add_company", response_model=CompanyWithSectorModel, dependencies=[Depends(verify_add_company_password)])
def add_company(new_company: CompanyCreateModel, db: Session = Depends(get_db)):
    if db.query(Company).filter(Company.cib_id == new_company.cib_id).first():
        raise HTTPException(status_code=400, detail="Company with this CIB ID already exists")

    if new_company.sector_id:
        sector = db.query(Sector).filter(Sector.sector_id == new_company.sector_id).first()
        if not sector:
            raise HTTPException(status_code=404, detail="Sector not found")

    company = Company(
        cib_id=new_company.cib_id,
        company_name=new_company.company_name,
        hq_country_id=new_company.hq_country_id,
        operation=new_company.operation,
        operation_date=new_company.operation_date
    )
    db.add(company)

    if new_company.sector_id:
        db.add(CompanySector(cib_id=new_company.cib_id, sector_id=new_company.sector_id))

    db.commit()
    db.refresh(company)

    company_sector = db.query(CompanySector).filter(CompanySector.cib_id == new_company.cib_id).first()
    sector = db.query(Sector).filter(Sector.sector_id == company_sector.sector_id).first() if company_sector else None

    return CompanyWithSectorModel(company=company, sector=sector)

# ----------------- SECTORS -----------------
# TYPE A LETTER AND GET SECTORS THAT START WITH THAT LETTER
@app.get("/sectors_by_letter/", response_model=List[SectorWithCompanyCountModel])
def sectors_by_letter(
    letter: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db)
):
    # Use ilike for case-insensitive matching
    results = (
        db.query(
            Sector.sector_id,
            Sector.sector_name,
            func.count(CompanySector.cib_id).label("company_count")
        )
        .outerjoin(CompanySector, Sector.sector_id == CompanySector.sector_id)
        .filter(Sector.sector_name.ilike(f"%{letter}%"))  # match anywhere in the name
        .group_by(Sector.sector_id, Sector.sector_name)
        .all()
    )
    return results

# HOW MANY COMPANIES ARE THERE IN EACH SECTOR
@app.get("/sectors_with_counts/", response_model=List[SectorWithCompanyCountModel])
def get_sectors_with_counts(db: Session = Depends(get_db)):
    results = (
        db.query(
            Sector.sector_id,
            Sector.sector_name,
            func.count(CompanySector.cib_id).label("company_count")
        )
        .outerjoin(CompanySector, Sector.sector_id == CompanySector.sector_id)
        .group_by(Sector.sector_id, Sector.sector_name)
        .all()
    )
    return results

# ADD NEW SECTOR

# Password for adding sectors (can be same as company or different)
ADD_SECTOR_PASSWORD = "supersecret123"

def verify_add_sector_password(x_password: str = Header(...)):
    """Checks the X-Password header for adding sectors."""
    if x_password != ADD_SECTOR_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/add_sector", response_model=SectorModel, dependencies=[Depends(verify_add_sector_password)])
def add_sector(new_sector: SectorCreateModel, db: Session = Depends(get_db)):
    # Check if sector already exists
    if db.query(Sector).filter(Sector.sector_name == new_sector.sector_name).first():
        raise HTTPException(status_code=400, detail="Sector with this name already exists")
    
    sector = Sector(
        sector_name=new_sector.sector_name,
        sector_radius_km=new_sector.sector_radius_km,
        parent_sector_id=new_sector.parent_sector_id
    )
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector

# Upload CSV


# --- Run Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)
