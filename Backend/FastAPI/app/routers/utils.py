from typing import Dict, Any
import json


def upper_except_email(data: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, str) and k.lower() != 'email':
            out[k] = v.upper()
        else:
            out[k] = v
    return out


def build_diff(before: Dict[str, Any] | None, after: Dict[str, Any] | None) -> str:
    return json.dumps({"before": before or {}, "after": after or {}}, ensure_ascii=False)