from fastapi import APIRouter

from backend.app.api.schemas.praca import PracaResponse
from backend.app.api.services.pracas import get_pracas_service

router =  APIRouter(
    prefix="/pracas",
    tags=["praças"]
)

@router.get('/', response_model=list[PracaResponse])
def get_pracas(limit: int | None = None, offset: int | None = None):
    return get_pracas_service(limit, offset) 