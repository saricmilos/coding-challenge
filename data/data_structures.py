from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base

# Define base class for SQLAlchemy ORM
Base = declarative_base()

class Company(Base):
    __tablename__ = 'companies'
    cib_id = Column(String, primary_key=True)  # string domain
    company_name = Column(String)
    hq_country_id = Column(String)
    operation = Column(String)
    operation_date = Column(Date)

class CompanySector(Base):
    __tablename__ = 'companies_sector'
    id = Column(Integer, primary_key=True, autoincrement=True)
    cib_id = Column(String)  # string domain
    sector_id = Column(Integer)

class Sector(Base):
    __tablename__ = 'sector'
    sector_id = Column(Integer, primary_key=True)
    sector_name = Column(String)
    sector_radius_km = Column(Float)
    parent_sector_id = Column(Float)
