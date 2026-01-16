# Coding Challenge

## Overview

This system allows users to explore and inspect companies, their associated sectors, and other relevant information. By providing access to company and sector data, users can make informed business decisions, analyze markets, and identify potential opportunities to increase profitability. The system also supports data manipulation, such as adding new companies or sectors and updating existing information, while keeping the process secure and organized.

---

## Steps

### Environment Setup
1. **Creating a virtual environment (venv)** to isolate dependencies.  
2. **Creating `.gitignore`** to avoid committing sensitive or unnecessary files.  
3. **Installing dependencies** like `FastAPI`, `SQLAlchemy`, `pandas`, and `uvicorn`.

### Data Preparation
1. **Importing libraries**: `pandas`, `SQLAlchemy`, `FastAPI`, etc.  
2. **Loading datasets**: three CSV files containing company and sector information.  
3. **Exploratory Data Analysis (EDA)**: checking for missing values, unique values, and basic statistics.  
4. **Data cleaning**:  
   - Dropped columns with 100% missing data.  
   - For columns with a few missing values (`county_id`), replaced missing data with `0`.  
   - For columns with ~50% missing (`sector_id`), replaced missing data with `0` to preserve records.  
5. **Checking unique values** to ensure consistency and avoid duplicates.  
6. **Merging datasets** and aggregating rows to prevent multiple entries for companies belonging to multiple sectors.  

### Backend Setup
1. **Creating the database** with three separate tables: `Company`, `Sector`, and `CompanySector`.  
2. **Defining database structures** in a separate `.py` file using SQLAlchemy ORM models.  
3. **Populating the database** from the CSV files through a dedicated script.  
4. **Creating a FastAPI application** with endpoints to fetch all companies, sectors, and company-sector relationships.  
5. **Search endpoints**:  
   - Type a letter to filter companies by name.  
   - Click on a company to get detailed information.  
   - Support pagination and customizable number of companies per page.  
6. **Data modification endpoints**:  
   - Update company information.  
   - Add new sectors (password-protected for security).  
7. **Analytics endpoints**:  
   - Count companies in each sector.  
   - Search sectors by name.  
8. **CSV upload endpoint**:  
   - Users can upload a CSV file with company names or IDs.  
   - Returns a table showing which sector each company belongs to.

---

## Architecture

- **Backend**: FastAPI (Python)  
- **Frontend**: PHP, CSS, JavaScript  
- **Database**: SQLite (lightweight, file-based)  
- **Containerization**: Docker (for deployment)  

---

## Data Model

**Entities and Relationships**:

1. **Company**  
   - Fields: `cib_id`, `company_name`, `hq_country_id`, `operation`, `operation_date`.  
   - Represents individual companies in the system.

2. **Sector**  
   - Fields: `sector_id`, `sector_name`, `sector_radius_km`, `parent_sector_id`.  
   - Represents industry sectors. Can have a hierarchical relationship via `parent_sector_id`.

3. **CompanySector (Relationship Table)**  
   - Fields: `cib_id`, `sector_id`.  
   - Defines a many-to-many relationship: a company can belong to multiple sectors, and a sector can have multiple companies.

---

## Key Trade-offs

- Used **SQLite** for simplicity instead of a full relational database like PostgreSQL, making setup faster but less scalable.  
- Missing data for some columns (`sector_id`, `county_id`) was filled with `0` instead of dropping rows, trading strict data integrity for completeness.  
- Frontend is minimal (PHP, CSS, JS) for prototyping; advanced UI/UX not implemented.  

---

## AI Usage

- **AI-written parts**: Initial FastAPI endpoints, CSV upload handling, and database query logic.  
- **Human-controlled parts**: Data cleaning decisions, database design, endpoint logic, and password protection.  
- AI provided boilerplate and logic suggestions, while humans validated business rules and workflow.  

---

## Limitations

- No authentication for general endpoints (except for adding companies/sectors).  
- Frontend UI is basic and not optimized for large datasets.  
- No real-time updates or notifications for changes in data.  
- Data validation is minimal beyond missing value handling.  
- CSV uploads require exact column names; no fuzzy matching implemented.

---

## Next Steps

- Add **user authentication and roles** to control access.  
- Implement a **React or Vue frontend** for better interactivity and visualization.  
- Migrate database to **PostgreSQL or MySQL** for production scalability.  
- Add **advanced data analytics**: sector trends, top companies by revenue, etc.  
- Improve **CSV handling**: allow fuzzy matching, different column names, and larger files.  
- Add **Docker Compose** for full stack deployment including backend, frontend, and database.  
