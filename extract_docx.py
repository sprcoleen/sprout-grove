import zipfile
import xml.etree.ElementTree as ET

docx_path = 'C:/Users/KVirata/Downloads/grove_help_spec.docx'

with zipfile.ZipFile(docx_path, 'r') as z:
    with z.open('word/document.xml') as f:
        content = f.read()

root = ET.fromstring(content)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

paragraphs = root.findall('.//w:p', ns)
lines = []
for para in paragraphs:
    texts = para.findall('.//w:t', ns)
    line = ''.join(t.text or '' for t in texts)
    lines.append(line)

full_text = '\n'.join(lines)

with open('C:/Users/KVirata/Desktop/sprout-garden/extracted_text.txt', 'w', encoding='utf-8') as out:
    out.write(full_text)

print('Done. Characters written:', len(full_text))
