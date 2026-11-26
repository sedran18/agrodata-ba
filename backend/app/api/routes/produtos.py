from fastapi import APIRouter

from backend.app.api.schemas.produto import ProdutoResponse
from backend.app.api.services.produtos import get_produtos

router = APIRouter(
    prefix="/produtos",
    tags=["produtos"]
)

@router.get('/', response_model=list[ProdutoResponse])
def get_produtos_route(limit: int | None = None, offset: int | None = None):
    return get_produtos(limit, offset)

