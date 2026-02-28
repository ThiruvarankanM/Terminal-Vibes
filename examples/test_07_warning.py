"""
Category: Warning
Triggers: 'warning:', 'warn:', 'deprecated'
Expected sound: spongebob-fail (default)
"""

print("=== Test: Warning Category ===")
print("Analysing project...\n")
print("DeprecationWarning: 'componentWillMount' will be removed in a future version.")
print("[warn] peer dependency react@^17 required but react@18.2.0 found.")
print("DeprecationWarning: Buffer() is deprecated due to security and usability issues.")
print("")
print("3 deprecation warnings found. Please review before merging.")
