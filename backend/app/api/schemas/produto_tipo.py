import uuid
from pydantic import BaseModel

class ProdutoTipo(BaseModel):
    id: uuid.UUID
    nome: str
    produto_id: uuid.UUID
    