from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base

SEVERITIES = ("Minor", "Major", "Critical")
STATUSES = ("Open", "Under Investigation", "CAPA Proposed", "Closed")
EVIDENCE_TYPES = ("document", "observation", "measurement", "equipment_log")


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    batch_number = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    process_stage = Column(String(255), nullable=False)
    date_occurred = Column(String(50), nullable=False)  # ISO date string from the form
    severity = Column(String(20), nullable=False, default="Major")
    description = Column(Text, nullable=False)
    immediate_action = Column(Text, nullable=False, default="")
    reported_by = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False, default="Open")

    # AI-generated, user-editable content (persisted as text / JSON text)
    ai_summary = Column(Text, nullable=True)
    ai_root_cause = Column(Text, nullable=True)   # JSON string: Ishikawa + 5 Whys
    ai_capa = Column(Text, nullable=True)         # JSON string: corrective/preventive lists

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidence = relationship("Evidence", back_populates="deviation",
                            cascade="all, delete-orphan", order_by="Evidence.id")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    deviation_id = Column(Integer, ForeignKey("deviations.id"), nullable=False)
    type = Column(String(30), nullable=False, default="observation")
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    deviation = relationship("Deviation", back_populates="evidence")
