from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.types import JSON
import datetime

DATABASE_URL = "sqlite:///./appdata.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class LabReport(Base):
    __tablename__ = "lab_reports"
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, index=True)
    sample_id = Column(String, index=True)
    report_date = Column(String, index=True)
    features_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    recommendations = relationship("Recommendation", back_populates="lab_report")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    lab_report_id = Column(Integer, ForeignKey("lab_reports.id"))
    query = Column(Text)
    llm_json = Column(JSON)
    enriched_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    lab_report = relationship("LabReport", back_populates="recommendations")
    proposals = relationship("Proposal", back_populates="recommendation")

class Proposal(Base):
    __tablename__ = "proposals"
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"))
    html_path = Column(String)
    pdf_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    recommendation = relationship("Recommendation", back_populates="proposals")

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    section = Column(String, index=True)  # Pretreatment, RO, Postreatment
    model_number = Column(String, index=True)
    product_name = Column(String)
    quantity = Column(Integer, default=1)
    user_id = Column(String, index=True, default="default") # For multi-user support
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)
