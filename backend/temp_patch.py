import re

with open('app/english_test/database.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace the query
in_get_items = False
new_lines = []

for i, line in enumerate(lines):
    if 'def get_items_for_selection' in line:
        in_get_items = True
        new_lines.append(line)
    elif in_get_items and 'SELECT * FROM items' in line:
        # Replace the SELECT line
        new_lines.append(line.replace('SELECT * FROM items', 'SELECT i.*, p.title as passage_title, p.content as passage_content\n                FROM items i\n                LEFT JOIN passages p ON i.passage_id = p.id'))
    elif in_get_items and 'WHERE stage = %s' in line:
        new_lines.append(line.replace('WHERE stage = %s', 'WHERE i.stage = %s'))
    elif in_get_items and 'AND panel = %s' in line:
        new_lines.append(line.replace('AND panel = %s', 'AND i.panel = %s'))
    elif in_get_items and 'AND form_id = %s' in line:
        new_lines.append(line.replace('AND form_id = %s', 'AND i.form_id = %s'))
    elif in_get_items and 'AND status = ' in line:
        new_lines.append(line.replace('AND status = ', 'AND i.status = '))
    elif in_get_items and 'query += " AND domain = %s"' in line:
        new_lines.append(line.replace('AND domain = %s', 'AND i.domain = %s'))
    elif in_get_items and 'AND id NOT IN' in line:
        new_lines.append(line.replace('AND id NOT IN', 'AND i.id NOT IN'))
    elif in_get_items and 'ORDER BY exposure_rate' in line:
        new_lines.append(line.replace('ORDER BY exposure_rate', 'ORDER BY i.exposure_rate').replace('exposure_count', 'i.exposure_count'))
    elif in_get_items and 'def ' in line and 'get_items_for_selection' not in line:
        in_get_items = False
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('app/english_test/database.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ database.py updated successfully!")
