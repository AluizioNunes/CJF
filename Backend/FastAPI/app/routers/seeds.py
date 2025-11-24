from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from ..database import get_db
from ..models.especialidade import Especialidade
from ..models.escritorio import Escritorio
from ..models.advogado import Advogado
from ..models.causas_processos import CausaProcesso
from datetime import date
from ..models.cliente import Cliente
from ..models.usuario import Usuario
from ..models.usuario_escritorio import UsuarioEscritorio
from ..models.advogado_escritorio import AdvogadoEscritorio
from ..models.perfil import Perfil
from ..models.permissao import Permissao


router = APIRouter()


def _get_or_create_especialidade(db: Session, nome: str) -> Especialidade:
    nome_u = nome.upper()
    row = db.query(Especialidade).filter(Especialidade.nome == nome_u).first()
    if row:
        return row
    row = Especialidade(nome=nome_u, descricao=None)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_escritorio(db: Session, data: Dict[str, str | None]) -> Escritorio:
    nome_u = (data.get("nome") or "").upper()
    row = db.query(Escritorio).filter(Escritorio.nome == nome_u).first()
    if row:
        return row
    # Observação: e-mails permanecem como informados; demais campos em maiúsculas
    row = Escritorio(
        nome=nome_u,
        cnpj=(data.get("cnpj") or None),
        email=(data.get("email") or None),
        telefone=(data.get("telefone") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_advogado(db: Session, data: Dict[str, str | int | None]) -> Advogado:
    nome_u = (data.get("nome") or "").upper()
    row = db.query(Advogado).filter(Advogado.nome == nome_u).first()
    if row:
        return row
    row = Advogado(
        nome=nome_u,
        oab=((data.get("oab") or "").upper() or None),
        email=(data.get("email") or None),
        telefone=((data.get("telefone") or "").upper() or None),
        especialidade_id=(data.get("especialidade_id") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_processo(db: Session, data: Dict[str, str | int | None]) -> CausaProcesso:
    numero_u = (data.get("numero") or "").upper()
    row = db.query(CausaProcesso).filter(CausaProcesso.numero == numero_u).first()
    if row:
        if data.get("valor") is not None:
            try:
                row.valor = data.get("valor")  # type: ignore
                db.commit()
                db.refresh(row)
            except Exception:
                pass
        if data.get("dataDistribuicao") is not None:
            try:
                iso = data.get("dataDistribuicao")
                row.dataDistribuicao = date.fromisoformat(iso) if isinstance(iso, str) else iso  # type: ignore
                db.commit()
                db.refresh(row)
            except Exception:
                pass
        return row
    row = CausaProcesso(
        numero=numero_u,
        descricao=((data.get("descricao") or "").upper() or None),
        status=((data.get("status") or "").upper() or None),
        cliente_id=(data.get("cliente_id") or None),
        advogado_id=(data.get("advogado_id") or None),
        escritorio_id=(data.get("escritorio_id") or None),
        especialidade_id=(data.get("especialidade_id") or None),
        dataDistribuicao=(date.fromisoformat(data.get("dataDistribuicao")) if isinstance(data.get("dataDistribuicao"), str) else data.get("dataDistribuicao") or None),
        valor=(data.get("valor") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_cliente(db: Session, data: Dict[str, str | None]) -> Cliente:
    nome_u = (data.get("nome") or "").upper()
    row = db.query(Cliente).filter(Cliente.nome == nome_u).first()
    if row:
        return row
    row = Cliente(
        nome=nome_u,
        cpf_cnpj=(data.get("cpf_cnpj") or None),
        email=(data.get("email") or None),
        telefone=(data.get("telefone") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_perfil(db: Session, data: Dict[str, str | None]) -> Perfil:
    nome_u = (data.get("nome") or "").upper()
    row = db.query(Perfil).filter(Perfil.nome == nome_u).first()
    if row:
        return row
    row = Perfil(
        nome=nome_u,
        descricao=(data.get("descricao") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_permissao(db: Session, data: Dict[str, str | None]) -> Permissao:
    nome_u = (data.get("nome") or "").upper()
    row = db.query(Permissao).filter(Permissao.nome == nome_u).first()
    if row:
        return row
    row = Permissao(
        nome=nome_u,
        descricao=(data.get("descricao") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_create_usuario(db: Session, data: Dict[str, str | None]) -> Usuario:
    # Username deve respeitar caixa informada (não forçar maiúsculas aqui)
    username = (data.get("username") or "").strip()
    row = db.query(Usuario).filter(Usuario.username == username).first()
    if row:
        return row
    row = Usuario(
        username=username,
        nome=(data.get("nome") or "").upper() or username.upper(),
        email=(data.get("email") or None),
        role=((data.get("role") or "").upper() or None),
        senha_hash=(data.get("senha") or None),
        permissoes=(data.get("permissoes") or None),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.post("/", summary="Criar dados de demonstração (seed)")
def seed_demo(db: Session = Depends(get_db)) -> Dict[str, object]:
    created = {
        "especialidades": 0,
        "escritorios": 0,
        "advogados": 0,
        "advogado_escritorios": 0,
        "clientes": 0,
        "causas_processos": 0,
        "perfis": 0,
        "permissoes": 0,
        "usuarios": 0,
    }

    # Especialidades (TODAS EM MAIÚSCULAS conforme solicitado)
    especialidades_lista: List[str] = [
        "COMPLIANCE",
        "DIREITO ADMINISTRATIVO",
        "DIREITO AMBIENTAL",
        "DIREITO CIVIL",
        "DIREITO CONSTITUCIONAL",
        "DIREITO DE FAMÍLIA E SUCESSÕES",
        "DIREITO DIGITAL",
        "DIREITO DO CONSUMIDOR",
        "DIREITO DO TRABALHO",
        "DIREITO ELEITORAL",
        "DIREITO EMPRESARIAL",
        "DIREITO INTERNACIONAL",
        "DIREITO PENAL",
        "DIREITO PREVIDENCIÁRIO",
        "DIREITO TRIBUTÁRIO",
        "RESOLUÇÃO DE CONFLITOS",
    ]
    esp_id_by_name: Dict[str, int] = {}
    for nome in especialidades_lista:
        row = _get_or_create_especialidade(db, nome)
        esp_id_by_name[row.nome] = row.id
        if row.nome == nome.upper():
            created["especialidades"] += 1 if row.id else 0  # aproximação; incrementa apenas na primeira criação

    # Escritórios (nomes em maiúsculas; e-mails mantidos conforme informados)
    escritorios_data = [
        {"nome": "ESCRITÓRIO ALFA", "cnpj": "11.111.111/0001-11", "email": "contato@alfa.com.br", "telefone": "(11) 1111-1111"},
        {"nome": "ESCRITÓRIO BETA", "cnpj": "22.222.222/0001-22", "email": "contato@beta.com.br", "telefone": "(21) 2222-2222"},
        {"nome": "ESCRITÓRIO GAMA", "cnpj": "33.333.333/0001-33", "email": "contato@gama.com.br", "telefone": "(31) 3333-3333"},
    ]
    office_id_by_name: Dict[str, int] = {}
    for o in escritorios_data:
        row = _get_or_create_escritorio(db, o)
        office_id_by_name[row.nome] = row.id
        if row.nome == (o["nome"] or "").upper():
            created["escritorios"] += 1 if row.id else 0

    # Advogados (nomes e OAB em maiúsculas; especialidade e vínculo lógico com escritório)
    advogados_data = [
        {"nome": "ANA SILVA", "oab": "OAB/SP 123456", "email": "ana.silva@alfa.com.br", "telefone": "(11) 1111-2222", "especialidade": "DIREITO TRIBUTÁRIO", "escritorio": "ESCRITÓRIO ALFA"},
        {"nome": "BRUNO SOUZA", "oab": "OAB/RJ 234567", "email": "bruno.souza@beta.com.br", "telefone": "(21) 2222-3333", "especialidade": "DIREITO PREVIDENCIÁRIO", "escritorio": "ESCRITÓRIO BETA"},
        {"nome": "CARLA PEREIRA", "oab": "OAB/MG 345678", "email": "carla.pereira@gama.com.br", "telefone": "(31) 3333-4444", "especialidade": "DIREITO DO CONSUMIDOR", "escritorio": "ESCRITÓRIO GAMA"},
        {"nome": "DIEGO ALMEIDA", "oab": "OAB/SP 456789", "email": "diego.almeida@alfa.com.br", "telefone": "(11) 1111-5555", "especialidade": "DIREITO CIVIL", "escritorio": "ESCRITÓRIO ALFA"},
        {"nome": "ELISA COSTA", "oab": "OAB/RJ 567890", "email": "elisa.costa@beta.com.br", "telefone": "(21) 2222-6666", "especialidade": "RESOLUÇÃO DE CONFLITOS", "escritorio": "ESCRITÓRIO BETA"},
        {"nome": "FELIPE RAMOS", "oab": "OAB/MG 678901", "email": "felipe.ramos@gama.com.br", "telefone": "(31) 3333-7777", "especialidade": "DIREITO AMBIENTAL", "escritorio": "ESCRITÓRIO GAMA"},
    ]
    adv_id_to_office_id: Dict[int, int] = {}
    for a in advogados_data:
        esp_id = esp_id_by_name.get(a["especialidade"].upper())
        adv_row = _get_or_create_advogado(db, {
            "nome": a["nome"],
            "oab": a["oab"],
            "email": a["email"],
            "telefone": a["telefone"],
            "especialidade_id": esp_id,
        })
        office_name = a.get("escritorio")
        office_names = a.get("escritorios") if isinstance(a.get("escritorios"), list) else ([office_name] if office_name else [])
        for on in office_names:
            oid = office_id_by_name.get((on or "").upper())
            if oid:
                if not db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == adv_row.id, AdvogadoEscritorio.escritorio_id == oid).first():
                    db.add(AdvogadoEscritorio(advogado_id=adv_row.id, escritorio_id=oid))
                    db.commit()
                    created["advogado_escritorios"] += 1
        adv_id_to_office_id[adv_row.id] = office_id_by_name.get((office_name or "").upper()) or None
        if adv_row.nome == a["nome"].upper():
            created["advogados"] += 1 if adv_row.id else 0

    # Clientes (nomes em maiúsculas)
    clientes_data = [
        {"nome": "ACME LTDA", "cpf_cnpj": "11.111.111/0001-11", "email": "contato@acme.com.br", "telefone": "(11) 1111-0000"},
        {"nome": "BETA COMERCIO", "cpf_cnpj": "22.222.222/0001-22", "email": "contato@beta.com.br", "telefone": "(21) 2222-0000"},
        {"nome": "GAMA SERVICOS", "cpf_cnpj": "33.333.333/0001-33", "email": "contato@gama.com.br", "telefone": "(31) 3333-0000"},
        {"nome": "JOAO SILVA", "cpf_cnpj": "123.456.789-00", "email": "joao.silva@example.com", "telefone": "(11) 99999-1111"},
        {"nome": "MARIA SOUZA", "cpf_cnpj": "987.654.321-00", "email": "maria.souza@example.com", "telefone": "(21) 99999-2222"},
    ]
    cliente_ids: List[int] = []
    for c in clientes_data:
        row = _get_or_create_cliente(db, c)
        cliente_ids.append(row.id)
        if row.nome == (c["nome"] or "").upper():
            created["clientes"] += 1 if row.id else 0

    # Causas/Processos (ligadas a um advogado, escritório e cliente)
    processos_data = [
        {"numero": "000001-12.2024.4.00.0001", "descricao": "AÇÃO TRIBUTÁRIA DE REPETIÇÃO DE INDÉBITO", "status": "EM ANDAMENTO", "cliente_id": cliente_ids[0], "advogado_id": list(adv_id_to_office_id.keys())[0], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[0]], "especialidade_id": esp_id_by_name.get("DIREITO TRIBUTÁRIO")},
        {"numero": "000002-34.2024.4.00.0002", "descricao": "BENEFÍCIO PREVIDENCIÁRIO", "status": "SUSPENSO", "cliente_id": cliente_ids[1], "advogado_id": list(adv_id_to_office_id.keys())[1], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[1]], "especialidade_id": esp_id_by_name.get("DIREITO PREVIDENCIÁRIO")},
        {"numero": "000003-56.2024.4.00.0003", "descricao": "RESPONSABILIDADE CIVIL POR DANOS", "status": "RECURSO", "cliente_id": cliente_ids[3], "advogado_id": list(adv_id_to_office_id.keys())[3], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[3]], "especialidade_id": esp_id_by_name.get("DIREITO CIVIL")},
        {"numero": "000004-78.2024.4.00.0004", "descricao": "CONSUMIDOR – VÍCIO DO PRODUTO", "status": "SENTENÇA", "cliente_id": cliente_ids[2], "advogado_id": list(adv_id_to_office_id.keys())[2], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[2]], "especialidade_id": esp_id_by_name.get("DIREITO DO CONSUMIDOR")},
        {"numero": "000005-90.2024.4.00.0005", "descricao": "CONFLITOS – MEDIAÇÃO", "status": "ACORDO", "cliente_id": cliente_ids[4], "advogado_id": list(adv_id_to_office_id.keys())[4], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[4]], "especialidade_id": esp_id_by_name.get("RESOLUÇÃO DE CONFLITOS")},
        {"numero": "000006-11.2024.4.00.0006", "descricao": "DANO AMBIENTAL", "status": "EM ANDAMENTO", "cliente_id": cliente_ids[3], "advogado_id": list(adv_id_to_office_id.keys())[5], "escritorio_id": adv_id_to_office_id[list(adv_id_to_office_id.keys())[5]], "especialidade_id": esp_id_by_name.get("DIREITO AMBIENTAL")},
    ]
    import random
    for idx, p in enumerate(processos_data, start=1):
        p["valor"] = round(random.uniform(5000, 50000), 2)
        # Distribuição: datas espalhadas ao longo do ano
        month = 1 + (idx % 12)
        day = 10 + (idx % 15)
        p["dataDistribuicao"] = f"2024-{month:02d}-{day:02d}"
        _ = _get_or_create_processo(db, p)
        created["causas_processos"] += 1

    # Perfis
    perfis_data = [
        {"nome": "ADMINISTRADOR", "descricao": "ACESSO TOTAL AO SISTEMA"},
        {"nome": "OPERACIONAL", "descricao": "ACESSO ÀS TELAS OPERACIONAIS"},
    ]
    for pf in perfis_data:
        row = _get_or_create_perfil(db, pf)
        if row.nome == (pf["nome"] or "").upper():
            created["perfis"] += 1 if row.id else 0

    # Permissões básicas
    permissoes_data = [
        {"nome": "USUARIOS_READ", "descricao": "LISTAR USUÁRIOS"},
        {"nome": "USUARIOS_WRITE", "descricao": "CRIAR/EDITAR USUÁRIOS"},
        {"nome": "PERFIL_READ", "descricao": "LISTAR PERFIS"},
        {"nome": "PERFIL_WRITE", "descricao": "CRIAR/EDITAR PERFIS"},
        {"nome": "PERMISSOES_READ", "descricao": "LISTAR PERMISSÕES"},
        {"nome": "PERMISSOES_WRITE", "descricao": "CRIAR/EDITAR PERMISSÕES"},
    ]
    for pm in permissoes_data:
        row = _get_or_create_permissao(db, pm)
        if row.nome == (pm["nome"] or "").upper():
            created["permissoes"] += 1 if row.id else 0

    # Usuário ADMIN padrão (compativel com tela de login: admin/admin)
    admin_user = {
        "username": "admin",
        "nome": "Administrador",
        "email": "admin@example.com",
        "role": "ADMIN",
        "senha": "admin",
        # Permissões serializadas; pode ser JSON ou texto simples
        "permissoes": "USUARIOS_READ,USUARIOS_WRITE,PERFIL_READ,PERFIL_WRITE,PERMISSOES_READ,PERMISSOES_WRITE",
    }
    u = _get_or_create_usuario(db, admin_user)
    created["usuarios"] += 1 if u.id else 0

    # Vincular admin a todos os escritórios
    for eid in office_id_by_name.values():
        if not db.query(UsuarioEscritorio).filter(UsuarioEscritorio.usuario_id == u.id, UsuarioEscritorio.escritorio_id == eid).first():
            db.add(UsuarioEscritorio(usuario_id=u.id, escritorio_id=eid))
            db.commit()

    return {"status": "OK", "created": created}