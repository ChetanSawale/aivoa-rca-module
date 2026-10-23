from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator

from .models import EVIDENCE_TYPES, SEVERITIES, STATUSES


class EvidenceCreate(BaseModel):
    type: str = "observation"
    title: str
    details: str = ""

    @field_validator("type")
    @classmethod
    def check_type(cls, v: str) -> str:
        if v not in EVIDENCE_TYPES:
            raise ValueError(f"type must be one of {EVIDENCE_TYPES}")
        return v


class EvidenceOut(EvidenceCreate):
    id: int
    deviation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DeviationCreate(BaseModel):
    title: str
    batch_number: str
    product_name: str
    process_stage: str
    date_occurred: str
    severity: str = "Major"
    description: str
    immediate_action: str = ""
    reported_by: str
    status: str = "Open"

    @field_validator("severity")
    @classmethod
    def check_severity(cls, v: str) -> str:
        if v not in SEVERITIES:
            raise ValueError(f"severity must be one of {SEVERITIES}")
        return v

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in STATUSES:
            raise ValueError(f"status must be one of {STATUSES}")
        return v


class DeviationUpdate(BaseModel):
    """All fields optional — used for status changes and saving edited AI output."""
    title: Optional[str] = None
    batch_number: Optional[str] = None
    product_name: Optional[str] = None
    process_stage: Optional[str] = None
    date_occurred: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    immediate_action: Optional[str] = None
    reported_by: Optional[str] = None
    status: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_root_cause: Optional[str] = None   # JSON string
    ai_capa: Optional[str] = None         # JSON string

    @field_validator("severity")
    @classmethod
    def check_severity(cls, v):
        if v is not None and v not in SEVERITIES:
            raise ValueError(f"severity must be one of {SEVERITIES}")
        return v

    @field_validator("status")
    @classmethod
    def check_status(cls, v):
        if v is not None and v not in STATUSES:
            raise ValueError(f"status must be one of {STATUSES}")
        return v


class DeviationOut(DeviationCreate):
    id: int
    ai_summary: Optional[str] = None
    ai_root_cause: Optional[str] = None
    ai_capa: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    evidence: List[EvidenceOut] = []

    class Config:
        from_attributes = True
