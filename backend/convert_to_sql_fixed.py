"""
Convert JSON items to SQL INSERT statements (FIXED for Prisma schema)
========================================================================

Matches actual Prisma schema columns.
"""

import json
import re

def escape_sql_string(text: str) -> str:
    """Escape single quotes for SQL"""
    if text is None:
        return 'NULL'
    text = text.replace("'", "''")
    return f"'{text}'"

def parse_lexile(lexile_str: str) -> int:
    """Convert '300L' to 300"""
    return int(lexile_str.replace('L', '').replace('+', ''))

def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())

def convert_passages_to_sql_fixed(passages_file: str, output_file: str):
    """Convert passages JSON to SQL matching Prisma schema"""

    with open(passages_file, 'r', encoding='utf-8') as f:
        passages = json.load(f)

    sql_lines = []
    sql_lines.append("-- English Adaptive Test Passages (Fixed)")
    sql_lines.append("-- =========================================")
    sql_lines.append(f"-- Total: {len(passages)} passages")
    sql_lines.append("")

    # Start INSERT statement matching Prisma schema
    sql_lines.append("INSERT INTO passages (")
    sql_lines.append("  title, content, lexile_score, word_count")
    sql_lines.append(") VALUES")

    for idx, passage in enumerate(passages):
        title = escape_sql_string(passage['title'])
        content = escape_sql_string(passage['text'])  # JSON has 'text', DB needs 'content'
        lexile_score = parse_lexile(passage['lexile'])
        word_count = count_words(passage['text'])

        # Create VALUES row
        value_row = f"  ({title}, {content}, {lexile_score}, {word_count})"

        if idx < len(passages) - 1:
            value_row += ","
        else:
            value_row += ";"

        sql_lines.append(value_row)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"[OK] Passages converted: {output_file}")
    return len(passages)

def convert_items_to_sql_fixed(items_file: str, output_file: str):
    """Convert items JSON to SQL matching Prisma schema"""

    with open(items_file, 'r', encoding='utf-8') as f:
        items = json.load(f)

    sql_lines = []
    sql_lines.append("-- English Adaptive Test Items (Fixed)")
    sql_lines.append("-- ====================================")
    sql_lines.append(f"-- Total: {len(items)} items")
    sql_lines.append("")

    # Map panel names to match MSTPanel enum
    panel_map = {
        'routing': 'routing',
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'low-low': 'L1',
        'low-high': 'L2',
        'med-low': 'M1',
        'med-high': 'M2',
        'high-med': 'H1',
        'high-high': 'H2'
    }

    # Start INSERT statement
    sql_lines.append("INSERT INTO items (")
    sql_lines.append("  passage_id, stem, options, correct_answer,")
    sql_lines.append("  domain, discrimination, difficulty, guessing,")
    sql_lines.append("  stage, panel, form_id, skill_tag")
    sql_lines.append(") VALUES")

    for idx, item in enumerate(items):
        # Extract fields
        passage_id = item.get('passage_id')
        if passage_id is None:
            passage_id = 'NULL'

        stem = escape_sql_string(item['stem'])

        # Convert options dict to JSONB string
        options_dict = item['options']
        options_json = json.dumps(options_dict, ensure_ascii=False).replace("'", "''")
        options = f"'{options_json}'"

        correct = escape_sql_string(item['correct_answer'])
        domain = escape_sql_string(item['domain'])
        disc = item['discrimination']
        diff = item['difficulty']
        guessing = 0.25
        stage = item['stage']

        # Map panel name
        panel_raw = item['panel']
        panel_enum = panel_map.get(panel_raw, 'routing')
        panel = escape_sql_string(panel_enum)

        # form_id: use 1 for all items (can be updated later)
        form_id = 1

        skill_tag = escape_sql_string(item.get('skill_tag', ''))

        # Create VALUES row
        value_row = f"  ({passage_id}, {stem}, {options}, {correct}, {domain}, {disc}, {diff}, {guessing}, {stage}, {panel}, {form_id}, {skill_tag})"

        if idx < len(items) - 1:
            value_row += ","
        else:
            value_row += ";"

        sql_lines.append(value_row)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"[OK] Items converted: {output_file}")
    return len(items)

if __name__ == "__main__":
    print("[START] Converting JSON to SQL (FIXED for Prisma schema)...")
    print()

    # Convert passages
    passages_count = convert_passages_to_sql_fixed(
        'generated_passages.json',
        'insert_passages_fixed.sql'
    )

    # Convert items
    items_count = convert_items_to_sql_fixed(
        'generated_600_items_complete.json',
        'insert_600_items_fixed.sql'
    )

    print()
    print("[DONE] Conversion complete:")
    print(f"  - Passages: {passages_count} → insert_passages_fixed.sql")
    print(f"  - Items: {items_count} → insert_600_items_fixed.sql")
    print()
    print("[NOTE] Fixed SQL files match Prisma schema:")
    print("  - Passages: content (not text), lexile_score (int), word_count")
    print("  - Items: options (JSONB), panel (enum), form_id=1")
    print()
