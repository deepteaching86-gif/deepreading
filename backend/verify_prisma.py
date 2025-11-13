"""
Verify Prisma Client Import - Diagnostic Script
"""
import sys
import os

print("=" * 80)
print("PRISMA CLIENT VERIFICATION")
print("=" * 80)

print(f"\nPython version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current directory: {os.getcwd()}")
print(f"\nPython path:")
for p in sys.path:
    print(f"  - {p}")

print("\n" + "=" * 80)
print("Attempting to import Prisma...")
print("=" * 80)

try:
    import prisma
    print(f"✓ prisma package found at: {prisma.__file__}")
    print(f"✓ prisma package version: {prisma.__version__}")

    try:
        from prisma import Prisma
        print("✓ Prisma client class imported successfully!")

        # Try to instantiate
        client = Prisma()
        print("✓ Prisma client instantiated successfully!")
        print("\n" + "=" * 80)
        print("SUCCESS: Prisma client is fully functional!")
        print("=" * 80)
        sys.exit(0)

    except Exception as e:
        print(f"✗ Failed to import Prisma client class:")
        print(f"  Error type: {type(e).__name__}")
        print(f"  Error message: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

except ImportError as e:
    print(f"✗ prisma package not found!")
    print(f"  Error: {e}")
    print("\nInstalled packages:")
    import subprocess
    result = subprocess.run([sys.executable, "-m", "pip", "list"], capture_output=True, text=True)
    print(result.stdout)
    sys.exit(1)
except Exception as e:
    print(f"✗ Unexpected error:")
    print(f"  Error type: {type(e).__name__}")
    print(f"  Error message: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
