"""오브젝트 스토리지 외부연동 — MOCK 구현.

실제로는 S3/MinIO 등에 업로드하지만, 여기서는 저장하지 않고 스토리지 키만 생성해 반환한다.
실제 연동은 Phase 5 에서 교체한다(시그니처 유지).
"""

import hashlib


def store_file(merchant_id: int, file_name: str, content: bytes) -> str:
    """파일을 저장(mock)하고 스토리지 키를 반환한다.

    키는 내용 해시 기반으로 생성해 결정적(deterministic)으로 만든다.
    """
    digest = hashlib.sha256(content).hexdigest()[:16]
    safe_name = file_name.replace("/", "_")
    return f"merchant/{merchant_id}/{digest}_{safe_name}"
