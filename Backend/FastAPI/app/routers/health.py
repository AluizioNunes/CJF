from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Verificar saúde")
def health_check():
    return {"status": "ok"}