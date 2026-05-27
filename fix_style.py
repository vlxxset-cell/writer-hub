from pathlib import Path
p = Path(r'c:\Users\topov\OneDrive\Рабочий стол\writer-hub\style.css')
text = p.read_text(encoding='utf-8')
print('length', len(text))
idx = text.find('/* ===== BOOK COVER (UPDATED CLEAN VERSION) ===== */')
print('marker', idx)
