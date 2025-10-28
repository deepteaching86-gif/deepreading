import json
import psycopg2
from psycopg2.extras import Json

# Database connection
DATABASE_URL = "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

def insert_items():
    # Load generated items
    with open("generated_52_items.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Insert passages first
        print("Inserting passages...")
        for passage in data["passages"]:
            # Calculate word count
            word_count = len(passage["content"].split())

            cur.execute("""
                INSERT INTO passages (id, title, content, word_count, lexile_score, ar_level, genre, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO NOTHING
            """, (
                passage["id"],
                passage["title"],
                passage["content"],
                word_count,
                passage["lexile_score"],
                passage.get("ar_score", 2.0),  # Use ar_score from JSON
                "narrative"  # Default genre
            ))

        conn.commit()
        print(f"Inserted {len(data['passages'])} passages")

        # Insert items
        print("Inserting items...")
        inserted_count = 0
        for item in data["items"]:
            # Convert skill_tags list to single skill_tag string
            skill_tag = item["skill_tags"][0] if item.get("skill_tags") else "general"

            # Determine text_type - enum values: expository, argumentative, narrative, practical
            text_type = "narrative" if item.get("passage_id") else "practical"

            cur.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, passage_id,
                    stem, options, correct_answer,
                    skill_tag, text_type, difficulty, discrimination, guessing,
                    status, exposure_count, exposure_rate,
                    point_biserial, correct_rate,
                    created_at, updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    NOW(), NOW()
                )
            """, (
                item["stage"],
                item["panel"],
                item["form_id"],
                item["domain"],
                item.get("passage_id"),  # May be None for non-reading items
                item["stem"],
                Json(item["options"]),
                item["correct_answer"],
                skill_tag,
                text_type,
                item["difficulty"],
                item["discrimination"],
                item["guessing"],
                item["status"],
                item["exposure_count"],
                item["exposure_rate"],
                None,  # point_biserial - will be calculated after testing
                None   # correct_rate - will be calculated after testing
            ))
            inserted_count += 1

        conn.commit()
        print(f"Successfully inserted {inserted_count} items")

        # Verify final counts
        cur.execute("SELECT COUNT(*) FROM items WHERE status = 'active'")
        total_items = cur.fetchone()[0]
        print(f"Total active items in database: {total_items}")

        # Show distribution
        cur.execute("""
            SELECT stage, panel, domain, COUNT(*) as count
            FROM items
            WHERE status = 'active'
            GROUP BY stage, panel, domain
            ORDER BY stage, panel, domain
        """)

        print("\nItem distribution:")
        for row in cur.fetchall():
            print(f"  Stage {row[0]}, Panel {row[1]}, Domain {row[2]}: {row[3]} items")

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_items()
