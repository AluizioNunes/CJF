from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from ..schemas.item import ItemCreate, ItemRead, ItemUpdate
from ..database import get_db
from ..models.item import Item

router = APIRouter()


@router.get("/", response_model=List[ItemRead], summary="Listar itens")
def list_items(db: Session = Depends(get_db)) -> List[ItemRead]:
    items = db.query(Item).all()
    return items


@router.post("/", response_model=ItemRead, summary="Criar item")
def create_item(payload: ItemCreate, db: Session = Depends(get_db)) -> ItemRead:
    item = Item(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ItemRead, summary="Obter item por ID")
def get_item(item_id: int, db: Session = Depends(get_db)) -> ItemRead:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.patch("/{item_id}", response_model=ItemRead, summary="Atualizar item")
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)) -> ItemRead:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", summary="Remover item")
def delete_item(item_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()
    return {"status": "deleted"}