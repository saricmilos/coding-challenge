# app/main.py
from fastapi import FastAPI, HTTPException, Query, Body, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, String, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pandas as pd
import ast
import io

# ------------------- FastAPI App -------------------
app = FastAPI(title="Company Lookup API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ------------------- Database Setup -------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./company.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# ------------------- SQLAlchemy Models -------------------
class Company(Base):
    __tablename__ = "companies"
    cib_id = Column(String, primary_key=True, index=True)
    company_name = Column(String, index=True, nullable=False)
    hq_country_id = Column(String)
    operation = Column(String)
    operation_date = Column(String)
    sector_id = Column(JSON)
    sector_name = Column(JSON)
    sector_radius_km = Column(JSON)
    parent_sector_id = Column(JSON)

Base.metadata.create_all(bind=engine)

# ------------------- Pydantic Models -------------------
class CompanyInfo(BaseModel):
    cib_id: str
    company_name: str
    hq_country_id: str
    operation: str
    operation_date: str
    sector_id: List[int]
    sector_name: List[str]
    sector_radius_km: List[int]
    parent_sector_id: List[float]

# ------------------- Root Endpoint -------------------
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
        <head><title>Company Lookup API</title></head>
        <body>
            <h2>Company Lookup API is running!</h2>
            <p>Available endpoints:</p>
            
            <h3>General:</h3>
            <ul>
                <li><a href="/health">/health</a> - Check API health</li>
            </ul>

            <h3>Companies:</h3>
            <ul>
                <li>/search_companies/?query=&lt;letters&gt; - Autocomplete companies</li>
                <li>/company/{company_name} - Lookup company info</li>
                <li>/company/add - <strong>POST</strong> endpoint to add a new company (send JSON)</li>
                <li>/company/upload_csv - <strong>POST</strong> endpoint to upload your own CSV file</li>
            </ul>
        </body>
    </html>
    """

# ------------------- Health Endpoint -------------------
@app.get("/health")
def health_check():
    db = SessionLocal()
    count = db.query(Company).count()
    db.close()
    return {"status": "ok", "num_companies": count}

# ------------------- Search Companies -------------------
@app.get("/search_companies/")
def search_companies(query: str = Query(..., min_length=1), limit: int = 20):
    db = SessionLocal()
    results = db.query(Company).filter(Company.company_name.ilike(f"%{query}%")).limit(limit).all()
    db.close()
    return {"query": query, "results": [c.company_name for c in results], "total_matches": len(results)}

# ------------------- Lookup Company -------------------
@app.get("/company/{company_name}", response_model=List[CompanyInfo])
def get_company(company_name: str):
    db = SessionLocal()
    results = db.query(Company).filter(Company.company_name.ilike(f"%{company_name}%")).all()
    db.close()
    if not results:
        raise HTTPException(status_code=404, detail="Company not found")
    return [CompanyInfo(
        cib_id=c.cib_id,
        company_name=c.company_name,
        hq_country_id=c.hq_country_id,
        operation=c.operation,
        operation_date=c.operation_date,
        sector_id=c.sector_id,
        sector_name=c.sector_name,
        sector_radius_km=c.sector_radius_km,
        parent_sector_id=c.parent_sector_id
    ) for c in results]

# ------------------- Add New Company -------------------
@app.post("/company/add", response_model=CompanyInfo)
def add_company(new_company: CompanyInfo = Body(...)):
    db = SessionLocal()
    # Check duplicate
    existing = db.query(Company).filter(Company.company_name.ilike(new_company.company_name)).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Company already exists")
    # Add new company
    company = Company(**new_company.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    db.close()
    return new_company

# ------------------- Upload CSV -------------------
@app.post("/company/upload_csv")
async def upload_company_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        contents = await file.read()
        df_new = pd.read_csv(io.BytesIO(contents))
        
        required_columns = ['cib_id','company_name','hq_country_id','operation','operation_date',
                            'sector_id','sector_name','sector_radius_km','parent_sector_id']
        missing_cols = [c for c in required_columns if c not in df_new.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")

        # Convert lists
        for col in ['sector_id','sector_name','sector_radius_km','parent_sector_id']:
            df_new[col] = df_new[col].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)

        db = SessionLocal()
        # Clear existing
        db.query(Company).delete()
        db.commit()
        # Bulk insert
        for _, row in df_new.iterrows():
            db.add(Company(**row.to_dict()))
        db.commit()
        db.close()
        return {"status": "success", "num_companies": len(df_new)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {e}")
