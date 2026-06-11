"""의존성 없는 최소 PDF 생성기 — 설계서 AIAnalysisReport.generatePDF() 대응.

외부 라이브러리 없이 유효한 단일 페이지 PDF(Helvetica)를 바이트로 생성한다.
한글 폰트 임베딩은 범위를 벗어나므로 ASCII 라인으로 렌더링한다(mock).
"""


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_report_pdf(title: str, lines: list[str]) -> bytes:
    """제목 + 본문 라인들로 단일 페이지 PDF 바이트를 생성한다."""
    content_parts = [f"BT /F1 18 Tf 70 790 Td ({_escape(title)}) Tj ET"]
    y = 758
    for line in lines:
        content_parts.append(f"BT /F1 11 Tf 70 {y} Td ({_escape(line)}) Tj ET")
        y -= 20
    content = "\n".join(content_parts).encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    pdf = b"%PDF-1.4\n"
    offsets: list[int] = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"

    xref_pos = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for off in offsets:
        pdf += f"{off:010d} 00000 n \n".encode()
    pdf += b"trailer\n" + f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode()
    pdf += b"startxref\n" + str(xref_pos).encode() + b"\n%%EOF"
    return pdf
