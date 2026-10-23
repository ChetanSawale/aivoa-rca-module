import json
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import ai_service, models, schemas
from .database import Base, engine, get_db
from .seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIVOA — AI Root Cause Analysis Module", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db = next(get_db())
    try:
        seed_if_empty(db)
    finally:
        db.close()


def _get_deviation(db: Session, deviation_id: int) -> models.Deviation:
    dev = db.query(models.Deviation).filter(models.Deviation.id == deviation_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Deviation not found")
    return dev


@app.get("/api/health")
def health():
    return {"status": "ok", "ai_provider": ai_service.active_provider()}


# ---------------------------------------------------------------- deviations
@app.get("/api/deviations", response_model=List[schemas.DeviationOut])
def list_deviations(db: Session = Depends(get_db)):
    return db.query(models.Deviation).order_by(models.Deviation.id.desc()).all()


@app.post("/api/deviations", response_model=schemas.DeviationOut, status_code=201)
def create_deviation(payload: schemas.DeviationCreate, db: Session = Depends(get_db)):
    dev = models.Deviation(**payload.model_dump())
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


@app.get("/api/deviations/{deviation_id}", response_model=schemas.DeviationOut)
def get_deviation(deviation_id: int, db: Session = Depends(get_db)):
    return _get_deviation(db, deviation_id)


@app.put("/api/deviations/{deviation_id}", response_model=schemas.DeviationOut)
def update_deviation(deviation_id: int, payload: schemas.DeviationUpdate,
                     db: Session = Depends(get_db)):
    dev = _get_deviation(db, deviation_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(dev, field, value)
    db.commit()
    db.refresh(dev)
    return dev


@app.delete("/api/deviations/{deviation_id}", status_code=204)
def delete_deviation(deviation_id: int, db: Session = Depends(get_db)):
    dev = _get_deviation(db, deviation_id)
    db.delete(dev)
    db.commit()
    return None


# ------------------------------------------------------------------ evidence
@app.post("/api/deviations/{deviation_id}/evidence",
          response_model=schemas.EvidenceOut, status_code=201)
def add_evidence(deviation_id: int, payload: schemas.EvidenceCreate,
                 db: Session = Depends(get_db)):
    _get_deviation(db, deviation_id)
    ev = models.Evidence(deviation_id=deviation_id, **payload.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@app.delete("/api/evidence/{evidence_id}", status_code=204)
def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.Evidence).filter(models.Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    db.delete(ev)
    db.commit()
    return None


# ------------------------------------------------------------------------ AI
def _ai_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ai_service.AIKeyNotConfiguredError):
        return HTTPException(status_code=503, detail=str(exc))
    return HTTPException(status_code=502, detail=f"AI provider error: {exc}")


@app.post("/api/deviations/{deviation_id}/ai/summary")
async def ai_summary(deviation_id: int, db: Session = Depends(get_db)):
    dev = _get_deviation(db, deviation_id)
    try:
        result = await ai_service.generate_summary(dev, dev.evidence)
    except Exception as exc:  # noqa: BLE001 — normalised into an API error below
        raise _ai_error(exc)
    dev.ai_summary = result.get("summary", "")
    db.commit()
    db.refresh(dev)
    return {"summary": dev.ai_summary}


@app.post("/api/deviations/{deviation_id}/ai/root-cause")
async def ai_root_cause(deviation_id: int, db: Session = Depends(get_db)):
    dev = _get_deviation(db, deviation_id)
    try:
        result = await ai_service.generate_root_cause(dev, dev.evidence)
    except Exception as exc:  # noqa: BLE001
        raise _ai_error(exc)
    dev.ai_root_cause = json.dumps(result)
    if dev.status == "Open":
        dev.status = "Under Investigation"
    db.commit()
    db.refresh(dev)
    return result


@app.post("/api/deviations/{deviation_id}/ai/capa")
async def ai_capa(deviation_id: int, db: Session = Depends(get_db)):
    dev = _get_deviation(db, deviation_id)
    try:
        result = await ai_service.generate_capa(dev, dev.evidence, dev.ai_root_cause)
    except Exception as exc:  # noqa: BLE001
        raise _ai_error(exc)
    dev.ai_capa = json.dumps(result)
    if dev.status in ("Open", "Under Investigation"):
        dev.status = "CAPA Proposed"
    db.commit()
    db.refresh(dev)
    return result
