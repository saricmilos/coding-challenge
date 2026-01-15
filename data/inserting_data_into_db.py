import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from data_structures import Company, CompanySector, Sector, Base
import os

# --- Database path ---
db_path = r'C:\Users\Milos\Desktop\GitHub_Kaggle_Projects\coding-challenge\data\database.sqlite'

# Delete the existing database to avoid old timestamp issues
if os.path.exists(db_path):
    os.remove(db_path)

# --- Create SQLite engine ---
engine = create_engine(f'sqlite:///{db_path}')
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

# --- Read CSVs ---
companies_df = pd.read_csv(r'C:\Users\Milos\Desktop\GitHub_Kaggle_Projects\coding-challenge\data\challenge_companies.csv')
companies_sector_df = pd.read_csv(r'C:\Users\Milos\Desktop\GitHub_Kaggle_Projects\coding-challenge\data\challenge_company_sectors.csv')
sector_df = pd.read_csv(r'C:\Users\Milos\Desktop\GitHub_Kaggle_Projects\coding-challenge\data\challenge_sectors.csv')

# --- Convert operation_date to pure date ---
companies_df['operation_date'] = pd.to_datetime(companies_df['operation_date'], errors='coerce')
companies_df['operation_date'] = companies_df['operation_date'].apply(lambda x: x.date() if pd.notnull(x) else None)

# --- Insert Sectors ---
for _, row in sector_df.iterrows():
    sector = Sector(
        sector_id=row['sector_id'],
        sector_name=row['sector_name'],
        sector_radius_km=row['sector_radius_km'],
        parent_sector_id=row['parent_sector_id']
    )
    session.add(sector)

# --- Insert Companies ---
for _, row in companies_df.iterrows():
    company = Company(
        cib_id=row['cib_id'],
        company_name=row['company_name'],
        hq_country_id=row['hq_country_id'],
        operation=row['operation'],
        operation_date=row['operation_date']
    )
    session.add(company)

# --- Insert Company-Sector relationships ---
for _, row in companies_sector_df.iterrows():
    comp_sector = CompanySector(
        cib_id=row['cib_id'],
        sector_id=row['sector_id']
    )
    session.add(comp_sector)

# --- Commit and close session ---
session.commit()
session.close()

print("Data successfully ingested into database.sqlite!")
