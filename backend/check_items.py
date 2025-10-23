import psycopg2
import os
from urllib.parse import quote_plus

# URL-encode the password
password = "DeepReading2025!@#$SecureDB"
encoded_password = quote_plus(password)
DATABASE_URL = f"postgresql://postgres.sxnjeqqvqbhueqbwsnpj:{encoded_password}@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Total count
    cur.execute("SELECT COUNT(*) FROM items;")
    total = cur.fetchone()[0]
    print(f"\n총 아이템 수: {total}")

    # By domain
    cur.execute("""
        SELECT domain, COUNT(*) as count
        FROM items
        GROUP BY domain
        ORDER BY domain;
    """)
    print("\n도메인별 아이템 수:")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}개")

    # By stage
    cur.execute("""
        SELECT stage, COUNT(*) as count
        FROM items
        GROUP BY stage
        ORDER BY stage;
    """)
    print("\nStage별 아이템 수:")
    for row in cur.fetchall():
        print(f"  Stage {row[0]}: {row[1]}개")

    # By panel
    cur.execute("""
        SELECT stage, panel, COUNT(*) as count
        FROM items
        GROUP BY stage, panel
        ORDER BY stage, panel;
    """)
    print("\nStage-Panel별 아이템 수:")
    for row in cur.fetchall():
        print(f"  Stage {row[0]}, {row[1]}: {row[2]}개")

    cur.close()
    conn.close()
    print("\n✅ 데이터베이스 연결 성공!")

except Exception as e:
    print(f"\n❌ 오류: {e}")
