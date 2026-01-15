# app/main.py
from pathlib import Path
import pandas as pd
import ast
from fastapi.responses import HTMLResponse
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from fastapi import File, UploadFile

# ------------------- FastAPI App -------------------
app = FastAPI(title="Company Lookup API")

# Allow CORS (for frontend use)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"]
)

# ------------------- Load Dataset -------------------
data_path = Path(__file__).resolve().parent.parent / "data" / "company_info.csv"

try:
    df_companies = pd.read_csv(data_path)
except FileNotFoundError:
    df_companies = pd.DataFrame()  # Empty DataFrame if CSV not found

# Convert string lists back to Python lists if saved from pandas
for col in ['sector_id', 'sector_name', 'sector_radius_km', 'parent_sector_id']:
    if col in df_companies.columns:
        df_companies[col] = df_companies[col].apply(ast.literal_eval)

# Extract list of all company names for search/autocomplete
company_names_list = sorted(df_companies['company_name'].tolist()) if not df_companies.empty else []

# ------------------- Response Model -------------------
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

            <h4>Example JSON for POST /company/add:</h4>
            <pre>
{
  "cib_id": "C123",
  "company_name": "NewTech Inc",
  "hq_country_id": "US",
  "operation": "Software",
  "operation_date": "2025-01-01",
  "sector_id": [2, 3],
  "sector_name": ["Agriculture", "Alternative Energy"],
  "sector_radius_km": [25, 25],
  "parent_sector_id": [0.0, 0.0]
}
            </pre>

            <h4>How to upload a CSV for companies:</h4>
            <p>Use the POST endpoint <strong>/company/upload_csv</strong> with form-data file input.</p>
            <p>CSV must have the following columns:</p>
            <pre>
cib_id,company_name,hq_country_id,operation,operation_date,sector_id,sector_name,sector_radius_km,parent_sector_id
            </pre>
        </body>
    </html>
    """



# ------------------- Health Check Endpoint -------------------
@app.get("/health")
def health_check():
    if df_companies.empty:
        return {"status": "error", "message": "Dataset not loaded!"}
    return {"status": "ok", "message": "API is healthy and dataset loaded", "num_companies": len(df_companies)}

# ------------------- Search Companies Endpoint -------------------
@app.get("/search_companies/")
def search_companies(query: str = Query(..., min_length=1), limit: int = 20):
    """
    Autocomplete: return companies containing the query string (case-insensitive)
    """
    if df_companies.empty:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    
    query_lower = query.lower()
    matches = [name for name in company_names_list if query_lower in name.lower()]
    matches = matches[:limit]
    
    return {"query": query, "results": matches, "total_matches": len(matches)}

# ------------------- Company Lookup Endpoint -------------------
@app.get("/company/{company_name}", response_model=List[CompanyInfo])
def get_company(company_name: str):
    if df_companies.empty:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    
    result = df_companies[df_companies['company_name'].str.contains(company_name, case=False)]
    if result.empty:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return result.to_dict(orient="records")

from fastapi import Body

# ------------------- Add New Company Endpoint -------------------
@app.post("/company/add", response_model=CompanyInfo)
def add_company(new_company: CompanyInfo = Body(...)):
    """
    Add a new company to the dataset.
    """
    global df_companies, company_names_list  # modify global DataFrame

    if df_companies.empty:
        # Create DataFrame with the correct columns if empty
        df_companies = pd.DataFrame(columns=new_company.dict().keys())
    
    # Check if company already exists (case-insensitive)
    if not df_companies[df_companies['company_name'].str.lower() == new_company.company_name.lower()].empty:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    # Append new company
    df_companies = pd.concat([df_companies, pd.DataFrame([new_company.dict()])], ignore_index=True)

    # Update CSV
    try:
        df_companies.to_csv(data_path, index=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save to CSV: {e}")
    
    # Update autocomplete list
    company_names_list.append(new_company.company_name)
    company_names_list.sort()

    return new_company

from fastapi import File, UploadFile

# ------------------- Upload CSV Endpoint -------------------
@app.post("/company/upload_csv")
async def upload_company_csv(file: UploadFile = File(...)):
    """
    Upload a new CSV file to replace the current company dataset.
    The CSV must have the same columns as the existing dataset:
    ['cib_id','company_name','hq_country_id','operation','operation_date','sector_id','sector_name','sector_radius_km','parent_sector_id']
    """
    global df_companies, company_names_list

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        # Read the uploaded CSV into a DataFrame
        contents = await file.read()
        df_new = pd.read_csv(pd.io.common.BytesIO(contents))

        # Check required columns
        required_columns = ['cib_id','company_name','hq_country_id','operation','operation_date',
                            'sector_id','sector_name','sector_radius_km','parent_sector_id']
        missing_cols = [c for c in required_columns if c not in df_new.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns in CSV: {missing_cols}")

        # Convert string lists back to Python lists if necessary
        for col in ['sector_id','sector_name','sector_radius_km','parent_sector_id']:
            df_new[col] = df_new[col].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)

        # Replace current dataset
        df_companies = df_new

        # Update autocomplete list
        company_names_list = sorted(df_companies['company_name'].tolist())

        # Save to disk
        df_companies.to_csv(data_path, index=False)

        return {"status": "success", "message": f"{len(df_companies)} companies loaded from uploaded CSV"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {e}")


# ------------------- Run Uvicorn -------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
