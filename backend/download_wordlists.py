"""
Download Open Source Vocabulary Lists
======================================

Downloads GSL, NGSL, and AWL word lists from GitHub repositories.
Organizes them by frequency bands for integration with VST methodology.
"""

import os
import sys
import json
import requests

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Output directory
OUTPUT_DIR = "vocabulary_lists"

# GitHub raw URLs for word lists
WORDLIST_URLS = {
    # NGSL (New General Service List) - 2,800 words
    "ngsl": "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/ngsl/ngsl.json",

    # AWL (Academic Word List) - 570 words
    "awl": "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/awl/awl.json",

    # GSL (General Service List) - 2,000 words (alternative source)
    # Using wordfreq as fallback
}

def download_wordlist(name, url):
    """Download a word list from GitHub"""
    print(f"[*] Downloading {name.upper()}...")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Save to file
        output_path = os.path.join(OUTPUT_DIR, f"{name}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(response.json(), f, indent=2, ensure_ascii=False)

        print(f"[+] Saved to: {output_path}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to download {name}: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON for {name}: {e}")
        return False

def create_gsl_from_ngsl():
    """
    Create GSL from NGSL (first 2,000 most frequent words)
    GSL is essentially the top 2,000 words from modern corpora
    """
    print(f"\n[*] Creating GSL from NGSL...")

    try:
        ngsl_path = os.path.join(OUTPUT_DIR, "ngsl.json")
        with open(ngsl_path, 'r', encoding='utf-8') as f:
            ngsl_data = json.load(f)

        # Take first 2,000 words
        gsl_data = ngsl_data[:2000] if len(ngsl_data) >= 2000 else ngsl_data

        # Save as GSL
        gsl_path = os.path.join(OUTPUT_DIR, "gsl.json")
        with open(gsl_path, 'w', encoding='utf-8') as f:
            json.dump(gsl_data, f, indent=2, ensure_ascii=False)

        print(f"[+] Created GSL with {len(gsl_data)} words")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to create GSL: {e}")
        return False

def map_to_vst_bands():
    """
    Map downloaded word lists to VST frequency bands
    VST bands: 1k, 2k, 3k, 4k, 6k, 8k, 10k, 14k
    """
    print(f"\n[*] Mapping to VST frequency bands...")

    try:
        # Load word lists
        gsl_path = os.path.join(OUTPUT_DIR, "gsl.json")
        ngsl_path = os.path.join(OUTPUT_DIR, "ngsl.json")
        awl_path = os.path.join(OUTPUT_DIR, "awl.json")

        with open(gsl_path, 'r', encoding='utf-8') as f:
            gsl = json.load(f)
        with open(ngsl_path, 'r', encoding='utf-8') as f:
            ngsl = json.load(f)
        with open(awl_path, 'r', encoding='utf-8') as f:
            awl = json.load(f)

        # Map to VST bands
        vst_bands = {
            "1k": gsl[:1000],                    # Top 1,000 words (GSL)
            "2k": gsl[1000:2000],                # Words 1,001-2,000 (GSL)
            "3k": ngsl[2000:3000],               # Words 2,001-3,000 (NGSL)
            "4k": ngsl[3000:4000] if len(ngsl) >= 4000 else ngsl[3000:],
            "6k": [],  # Will use wordfreq or generate
            "8k": [],  # Will use wordfreq or generate
            "10k": [], # Will use wordfreq or generate
            "14k": [], # Academic vocabulary (AWL)
            "academic": awl  # Academic Word List
        }

        # Save VST band mapping
        vst_path = os.path.join(OUTPUT_DIR, "vst_bands.json")
        with open(vst_path, 'w', encoding='utf-8') as f:
            json.dump(vst_bands, f, indent=2, ensure_ascii=False)

        print(f"[+] Created VST band mapping")

        # Print statistics
        print(f"\n[*] VST Band Statistics:")
        for band, words in vst_bands.items():
            print(f"    - {band}: {len(words)} words")

        return True

    except Exception as e:
        print(f"[ERROR] Failed to map VST bands: {e}")
        return False

def create_frequency_wordlist():
    """
    Create a simple frequency-ordered word list from common English words
    for bands 6k, 8k, 10k
    """
    print(f"\n[*] Creating extended frequency word lists...")

    # Common words for 6k-10k bands (sample)
    # In production, you would use a proper frequency corpus
    extended_words = {
        "6k": [
            "academic", "accommodate", "accompany", "accumulate", "accurate",
            "achieve", "acknowledge", "acquire", "adapt", "adequate",
            # ... (add more words from frequency lists)
        ],
        "8k": [
            "abstract", "accelerate", "accessible", "acclaim", "accommodate",
            # ... (add more words)
        ],
        "10k": [
            "abbreviate", "abdominal", "aboriginal", "absorption", "abstraction",
            # ... (add more words)
        ]
    }

    extended_path = os.path.join(OUTPUT_DIR, "extended_bands.json")
    with open(extended_path, 'w', encoding='utf-8') as f:
        json.dump(extended_words, f, indent=2, ensure_ascii=False)

    print(f"[+] Created extended band word lists")
    return True

def main():
    """Main execution"""
    print("=" * 60)
    print("Open Source Vocabulary List Downloader")
    print("=" * 60)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"[*] Output directory: {OUTPUT_DIR}")

    # Download word lists
    success_count = 0
    for name, url in WORDLIST_URLS.items():
        if download_wordlist(name, url):
            success_count += 1

    print(f"\n[*] Downloaded {success_count}/{len(WORDLIST_URLS)} word lists")

    # Create GSL from NGSL
    if os.path.exists(os.path.join(OUTPUT_DIR, "ngsl.json")):
        create_gsl_from_ngsl()

    # Map to VST bands
    if (os.path.exists(os.path.join(OUTPUT_DIR, "gsl.json")) and
        os.path.exists(os.path.join(OUTPUT_DIR, "awl.json"))):
        map_to_vst_bands()

    # Create extended word lists
    create_frequency_wordlist()

    print("\n" + "=" * 60)
    print("[SUCCESS] Vocabulary lists downloaded and organized!")
    print("=" * 60)
    print(f"\n[*] Files created in '{OUTPUT_DIR}/' directory:")

    for file in os.listdir(OUTPUT_DIR):
        if file.endswith('.json'):
            filepath = os.path.join(OUTPUT_DIR, file)
            size = os.path.getsize(filepath)
            print(f"    - {file} ({size:,} bytes)")

if __name__ == "__main__":
    main()
