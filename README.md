# coding-challenge
 ## STEPS
 1. Creating VENV, gitignore, installing dependencies
 2. Importing Libraries, Loading Datasets
 3. Exploratory data analysis, cleaning the data, removing missing values
 4. Dropped columns with 100% missing data, where i have 12 missing data county_id i added 0, not dropping, and where i have 50% i added 0 for sector_id
 5. Checking for unique values
 6. Merge datasets, and agregate values that appear multiple times so we don't have multiple rows for comapnies (if company belongs to different sectors)
 7. Creating FASTAPI - one for merged dataset with comapnies info and sector the belong, and one only for sector
 8. Added database using SQLlite and SQLAlchemy

LIKE THIS DOESN"T WORK

STEPS:
1. Created database with 3 seperate tables
2. Created .py file to define our database data structures
3. Created .py file to Add 3 csv files into our database
4. Created fastapi file with 3 get endpoints to get all companies, sectors and comapnies_sectors
 

## Overview
What the system does and why

## Architecture
Backend, frontend, DB, Docker

## Data Model
Explain Company, Sector, relationships

## Key Trade-offs
What you simplified and why

## AI Usage
What AI wrote vs what you controlled

## Limitations
What’s missing

## Next Steps
How this would evolve in production
