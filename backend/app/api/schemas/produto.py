import uuid
from pydantic import BaseModel, ConfigDict

class ProdutoResponse(BaseModel):
    id: uuid.UUID
    nome: str

    model_config = ConfigDict(from_attributes=True)
    
    
    