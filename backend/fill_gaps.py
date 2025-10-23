"""
Fill Gaps - Generate remaining 31 items to reach 600 total
===========================================================

Adds:
- 24 grammar items (to reach 200)
- 7 vocabulary items (to reach 200)
"""

import json
import random
from generate_600_items import (
    GRAMMAR_TEMPLATES, VOCABULARY, VST_BANDS,
    generate_grammar_item, generate_vocabulary_item,
    assign_irt_parameters
)

def fill_grammar_gap(existing_count: int, target: int = 200):
    """Generate additional grammar items to reach target"""
    items = []
    needed = target - existing_count

    # Distribute across stages
    stage_distribution = [
        (1, 'routing', needed // 3),
        (2, 'medium', needed // 3),
        (3, 'high-med', needed - (2 * (needed // 3)))
    ]

    for stage, panel, count in stage_distribution:
        skills = list(GRAMMAR_TEMPLATES.keys())

        for i in range(count):
            skill = skills[i % len(skills)]
            templates = GRAMMAR_TEMPLATES[skill]
            template_data = random.choice(templates)

            stem_template = template_data[0]
            options_list = template_data[1]
            correct_idx = template_data[2] if template_data[2] is not None else random.randint(0, 3)

            disc, diff = assign_irt_parameters(stage, panel, i, count)

            options_str = random.choice(options_list)
            item = generate_grammar_item(stem_template, options_str, correct_idx,
                                        skill, stage, panel, disc, diff)
            items.append(item)

    return items

def fill_vocabulary_gap(existing_count: int, target: int = 200):
    """Generate additional vocabulary items to reach target"""
    items = []
    needed = target - existing_count

    # Use medium and high bands
    bands_to_use = ['4k', '6k', '8k']

    for i in range(needed):
        band_name = bands_to_use[i % len(bands_to_use)]
        band_data = VST_BANDS[band_name]

        word = band_data['words'][i % len(band_data['words'])]
        definition = band_data['definitions'][i % len(band_data['definitions'])]

        # Assign to Stage 2 medium or Stage 3
        if i < needed // 2:
            stage, panel = 2, 'medium'
        else:
            stage, panel = 3, 'med-high'

        disc, diff = assign_irt_parameters(stage, panel, i, needed)

        item = generate_vocabulary_item(word, definition, band_name,
                                       stage, panel, disc, diff)
        items.append(item)

    return items

if __name__ == "__main__":
    print("[START] Filling gaps to reach 600 items...")
    print()

    # Load existing items
    with open('generated_600_items.json', 'r', encoding='utf-8') as f:
        existing_items = json.load(f)

    # Count by domain
    grammar_count = len([i for i in existing_items if i['domain'] == 'grammar'])
    vocab_count = len([i for i in existing_items if i['domain'] == 'vocabulary'])
    reading_count = len([i for i in existing_items if i['domain'] == 'reading'])

    print(f"[CURRENT] Existing items:")
    print(f"  - Grammar: {grammar_count}")
    print(f"  - Vocabulary: {vocab_count}")
    print(f"  - Reading: {reading_count}")
    print(f"  Total: {len(existing_items)}")
    print()

    # Fill gaps
    additional_grammar = fill_grammar_gap(grammar_count)
    additional_vocab = fill_vocabulary_gap(vocab_count)

    print(f"[ADDING] Additional items:")
    print(f"  - Grammar: {len(additional_grammar)}")
    print(f"  - Vocabulary: {len(additional_vocab)}")
    print()

    # Combine
    all_items = existing_items + additional_grammar + additional_vocab

    # Save
    output_file = "generated_600_items_complete.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)

    # Final count
    final_grammar = len([i for i in all_items if i['domain'] == 'grammar'])
    final_vocab = len([i for i in all_items if i['domain'] == 'vocabulary'])
    final_reading = len([i for i in all_items if i['domain'] == 'reading'])

    print(f"[DONE] Complete 600 items:")
    print(f"  - Grammar: {final_grammar}")
    print(f"  - Vocabulary: {final_vocab}")
    print(f"  - Reading: {final_reading}")
    print(f"  Total: {len(all_items)}")
    print(f"  Saved to: {output_file}")
    print()
