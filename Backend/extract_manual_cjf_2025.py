import sys
from pathlib import Path
from pdfminer.high_level import extract_text

def main():
    pdf_path = Path(__file__).parent / 'manual_de_calculos_2025_vf.pdf'
    if not pdf_path.exists():
        print('PDF não encontrado:', pdf_path)
        sys.exit(1)
    try:
        text = extract_text(str(pdf_path))
        out_path = Path(__file__).parent / 'manual_cjf_2025_extract.txt'
        out_path.write_text(text, encoding='utf-8')
        print('Extração concluída:', out_path)
    except Exception as e:
        print('Falha ao extrair texto:', e)
        sys.exit(1)

if __name__ == '__main__':
    main()