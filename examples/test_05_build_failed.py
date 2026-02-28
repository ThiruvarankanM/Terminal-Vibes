"""
Category: Build Failed
Triggers: 'build failed', 'compilation failed'
Expected sound: sad-violin / downer_noise (default)
"""

print("=== Test: Build Failed Category ===")
print("Starting build...\n")
print("[1/3] Resolving dependencies...")
print("[2/3] Compiling TypeScript...")
print("")
print("src/index.ts(24,5): error TS2322: Type 'string' is not assignable to type 'number'.")
print("src/utils.ts(10,3): error TS2304: Cannot find name 'fetch'.")
print("")
print("Found 2 errors.")
print("compilation failed — build failed.")
