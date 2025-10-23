"""
Convert JSON items to SQL INSERT statements
===========================================

Converts 600 items + 100 passages to SQL format for database insertion.
"""

import json
import re

def escape_sql_string(text: str) -> str:
    """Escape single quotes and special characters for SQL"""
    if text is None:
        return 'NULL'
    # Replace single quotes with two single quotes (SQL escape)
    text = text.replace("'", "''")
    return f"'{text}'"

def convert_items_to_sql(items_file: str, output_file: str):
    """Convert items JSON to SQL INSERT statements"""

    with open(items_file, 'r', encoding='utf-8') as f:
        items = json.load(f)

    sql_lines = []
    sql_lines.append("-- English Adaptive Test Items")
    sql_lines.append("-- =============================")
    sql_lines.append("-- Total: 600 items (200 grammar + 200 vocabulary + 200 reading)")
    sql_lines.append("")

    # Group by domain for better organization
    grammar_items = [i for i in items if i['domain'] == 'grammar']
    vocab_items = [i for i in items if i['domain'] == 'vocabulary']
    reading_items = [i for i in items if i['domain'] == 'reading']

    sql_lines.append(f"-- Grammar Items: {len(grammar_items)}")
    sql_lines.append(f"-- Vocabulary Items: {len(vocab_items)}")
    sql_lines.append(f"-- Reading Items: {len(reading_items)}")
    sql_lines.append("")

    # Start INSERT statement
    sql_lines.append("INSERT INTO items (")
    sql_lines.append("  stem, option_a, option_b, option_c, option_d,")
    sql_lines.append("  correct_answer, domain, skill_tag, stage, panel,")
    sql_lines.append("  discrimination, difficulty, guessing, passage_id")
    sql_lines.append(") VALUES")

    # Generate VALUES for each item
    for idx, item in enumerate(items):
        stem = escape_sql_string(item['stem'])
        option_a = escape_sql_string(item['options']['A'])
        option_b = escape_sql_string(item['options']['B'])
        option_c = escape_sql_string(item['options']['C'])
        option_d = escape_sql_string(item['options']['D'])
        correct = escape_sql_string(item['correct_answer'])
        domain = escape_sql_string(item['domain'])
        skill_tag = escape_sql_string(item['skill_tag'])
        stage = item['stage']
        panel = escape_sql_string(item['panel'])
        disc = item['discrimination']
        diff = item['difficulty']
        guessing = 0.25  # Default 3PL guessing parameter
        passage_id = item.get('passage_id', 'NULL')

        # Create VALUES row
        value_row = f"  ({stem}, {option_a}, {option_b}, {option_c}, {option_d}, {correct}, {domain}, {skill_tag}, {stage}, {panel}, {disc}, {diff}, {guessing}, {passage_id})"

        # Add comma unless last item
        if idx < len(items) - 1:
            value_row += ","
        else:
            value_row += ";"

        sql_lines.append(value_row)

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"[OK] Items converted to SQL: {output_file}")
    return len(items)

def convert_passages_to_sql(passages_file: str, output_file: str):
    """Convert passages JSON to SQL INSERT statements"""

    with open(passages_file, 'r', encoding='utf-8') as f:
        passages = json.load(f)

    sql_lines = []
    sql_lines.append("-- English Adaptive Test Passages")
    sql_lines.append("-- ================================")
    sql_lines.append(f"-- Total: {len(passages)} passages")
    sql_lines.append("")

    # Start INSERT statement
    sql_lines.append("INSERT INTO passages (")
    sql_lines.append("  id, title, text, lexile, stage, panel")
    sql_lines.append(") VALUES")

    # Generate VALUES for each passage
    for idx, passage in enumerate(passages):
        passage_id = passage['id']
        title = escape_sql_string(passage['title'])
        text = escape_sql_string(passage['text'])
        lexile = escape_sql_string(passage['lexile'])
        stage = passage['stage']
        panel = escape_sql_string(passage['panel'])

        # Create VALUES row
        value_row = f"  ({passage_id}, {title}, {text}, {lexile}, {stage}, {panel})"

        # Add comma unless last passage
        if idx < len(passages) - 1:
            value_row += ","
        else:
            value_row += ";"

        sql_lines.append(value_row)

    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"[OK] Passages converted to SQL: {output_file}")
    return len(passages)

if __name__ == "__main__":
    print("[START] Converting JSON to SQL...")
    print()

    # Convert items
    items_count = convert_items_to_sql(
        'generated_600_items_complete.json',
        'insert_600_items.sql'
    )

    # Convert passages
    passages_count = convert_passages_to_sql(
        'generated_passages.json',
        'insert_passages.sql'
    )

    print()
    print("[DONE] Conversion complete:")
    print(f"  - Items: {items_count} → insert_600_items.sql")
    print(f"  - Passages: {passages_count} → insert_passages.sql")
    print()
    print("[NEXT STEP] Run these SQL files in Supabase:")
    print("  1. First run: insert_passages.sql")
    print("  2. Then run: insert_600_items.sql")
    print()
