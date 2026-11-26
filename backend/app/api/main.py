from fastapi import FastAPI
import uvicorn

from backend.app.api.routes import cotacoes, estatisticas, pracas, produtos

app = FastAPI()

app.include_router(cotacoes.router)
app.include_router(estatisticas.router)
app.include_router(pracas.router)
app.include_router(produtos.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
