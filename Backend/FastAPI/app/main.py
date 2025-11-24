from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .routers import health, items
from .routers import advogados, clientes, causas_processos, especialidades, parametros, usuarios, perfil, permissoes, auditoria, auth, escritorios, seeds
from .database import Base, engine
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
import time

tags_metadata = [
    {
        "name": "health",
        "description": "Verificação de saúde do serviço.",
    },
    {
        "name": "items",
        "description": "Endpoints de itens de exemplo (CRUD simplificado).",
    },
    {"name": "escritorios", "description": "CRUD de Escritórios"},
    {"name": "advogados", "description": "CRUD de Advogados"},
    {"name": "clientes", "description": "CRUD de Clientes"},
    {"name": "causas_processos", "description": "CRUD de Causas e Processos"},
    {"name": "especialidades", "description": "CRUD de Especialidades"},
    {"name": "parametros", "description": "Persistência de Parâmetros"},
    {"name": "usuarios", "description": "CRUD de Usuários"},
    {"name": "perfil", "description": "CRUD de Perfil"},
    {"name": "permissoes", "description": "CRUD de Permissões"},
    {"name": "auditoria", "description": "Registros de auditoria"},
    {"name": "auth", "description": "Autenticação e usuário atual"},
    {"name": "seeds", "description": "Criação de dados de demonstração"},
]

app = FastAPI(
    title="CJF API",
    description=(
        "API estruturada com FastAPI e Swagger UI em /docs. "
        "Rotas organizadas em app/routers e modelos em app/schemas."
    ),
    version="0.1.0",
    openapi_tags=tags_metadata,
)

# CORS (permitir frontend local e via NGINX)
_origins_env = os.getenv("CORS_ORIGINS")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] if _origins_env else None
if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", summary="Status da API")
def read_root():
    return {"message": "API em execução"}


# Registrando routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(parametros.router, prefix="/parametros", tags=["parametros"])
app.include_router(especialidades.router, prefix="/especialidades", tags=["especialidades"])
app.include_router(escritorios.router, prefix="/escritorios", tags=["escritorios"])
app.include_router(advogados.router, prefix="/advogados", tags=["advogados"])
app.include_router(clientes.router, prefix="/clientes", tags=["clientes"])
app.include_router(causas_processos.router, prefix="/causas-processos", tags=["causas_processos"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
app.include_router(perfil.router, prefix="/perfil", tags=["perfil"])
app.include_router(permissoes.router, prefix="/permissoes", tags=["permissoes"])
app.include_router(auditoria.router, prefix="/auditoria", tags=["auditoria"])
app.include_router(seeds.router, prefix="/seeds", tags=["seeds"])


@app.on_event("startup")
def on_startup():
    # Aguardar banco ficar pronto e criar tabelas
    for _ in range(30):  # até ~30s
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            time.sleep(1)

    # Garantir coluna 'valor' em CausasProcessos
    with engine.begin() as conn:
        exists = conn.execute(text(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'CausasProcessos'
              AND column_name = 'valor'
            """
        )).scalar() is not None
        if not exists:
            conn.execute(text("ALTER TABLE \"CausasProcessos\" ADD COLUMN valor numeric(14,2) DEFAULT 0 NOT NULL"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)