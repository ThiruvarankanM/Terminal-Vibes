"""
Category: Error / Crash
Triggers: 'error:', 'exception', 'traceback', 'fatal:', 'panic:'
Expected sound: fahhhh (default)
"""

print("=== Test: Error / Crash Category ===")
print("Simulating a runtime crash...\n")

print("Traceback (most recent call last):")
print('  File "app.py", line 42, in <module>')
print("    result = 10 / 0")
print("ZeroDivisionError: division by zero")
print("\nfatal: process exited with code 1")
