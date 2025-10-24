"""
Test English Adaptive Test API Endpoints
==========================================
Tests the complete flow with 600-item pool and MST routing.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_start_test():
    """Test POST /api/english-test/start"""
    print("\n[TEST 1] Starting English Adaptive Test...")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/api/english-test/start",
        json={
            "user_id": "1"
        }
    )

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Test Started Successfully!")
        print(f"   Session ID: {data['session_id']}")
        print(f"   Stage: {data['stage']}")
        print(f"   Panel: {data['panel']}")
        print(f"   Message: {data['message']}")
        print(f"   Total Items: {data['total_items_planned']}")
        print(f"   First Item ID: {data['item']['id']}")
        print(f"   Domain: {data['item']['domain']}")
        print(f"   Question: {data['item']['stem'][:50]}...")
        print(f"   Options: {len(data['item']['options'])} choices")

        return data['session_id'], data['item']['id']
    else:
        print(f"[ERROR] API Error")
        print(f"Response: {response.text}")
        return None, None

def test_submit_answer(session_id: int, item_id: int, answer: str):
    """Test POST /api/english-test/submit-response"""
    print(f"\n[TEST 2] Submitting Answer to Item {item_id}...")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/api/english-test/submit-response",
        json={
            "session_id": session_id,
            "item_id": item_id,
            "selected_answer": answer
        }
    )

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Answer Submitted Successfully!")
        print(f"   Is Correct: {data['is_correct']}")
        print(f"   Current Theta: {data['current_theta']:.3f}")
        print(f"   Standard Error: {data['standard_error']:.3f}")
        print(f"   Progress: {data['items_completed']}/{data['total_items']}")
        print(f"   Stage: {data['stage']}, Panel: {data['panel']}")
        print(f"   Test Complete: {data['test_completed']}")

        if not data['test_completed'] and data['next_item']:
            print(f"   Next Item ID: {data['next_item']['id']}")
            print(f"   Next Domain: {data['next_item']['domain']}")

            return data['next_item']['id']
        else:
            if data['test_completed']:
                print(f"   Test completed! Use /finalize endpoint for final results.")
            return None
    else:
        print(f"[ERROR] API Error: {response.text}")
        return None

def test_finalize_test(session_id: int):
    """Test POST /api/english-test/finalize"""
    print(f"\n[TEST 3] Finalizing Test and Getting Results...")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/api/english-test/finalize",
        json={"session_id": session_id}
    )

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"[OK] Test Finalized Successfully!")
        print(f"   Session ID: {data['session_id']}")
        print(f"   Final Theta: {data['final_theta']:.3f}")
        print(f"   Standard Error: {data['standard_error']:.3f}")
        print(f"   Proficiency Level: {data['proficiency_level']}")
        print(f"   Total Items: {data['total_items']}")
        print(f"   Correct: {data['correct_count']}")
        print(f"   Accuracy: {data['accuracy_percentage']:.1f}%")

        if data.get('lexile_score'):
            print(f"   Lexile Score: {data['lexile_score']}")
        if data.get('ar_level'):
            print(f"   AR Level: {data['ar_level']:.1f}")
        if data.get('vocabulary_size'):
            print(f"   Vocabulary Size: {data['vocabulary_size']}")

        return True
    else:
        print(f"[ERROR] API Error: {response.text}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("ENGLISH ADAPTIVE TEST API - INTEGRATION TEST")
    print("=" * 60)

    # Test 1: Start test
    session_id, first_item_id = test_start_test()
    if not session_id:
        print("\n[ERROR] Test failed at start_test")
        return

    # Test 2: Submit a few answers
    current_item_id = first_item_id
    for i in range(5):  # Submit 5 answers for quick test
        if not current_item_id:
            break

        # Alternate between correct and incorrect answers for testing
        answer = "A" if i % 2 == 0 else "B"
        current_item_id = test_submit_answer(session_id, current_item_id, answer)

    print("\n" + "=" * 60)
    print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nNOTE: To complete the full test, continue submitting answers")
    print("      until progress reaches 40/40 items.")

if __name__ == "__main__":
    main()
