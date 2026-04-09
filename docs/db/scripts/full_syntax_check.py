
import re

def check_all_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    chars = {'{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0}
    stack = []
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Remove strings and comments for more accurate brace counting
        clean_line = re.sub(r'//.*', '', line)
        clean_line = re.sub(r'".*?"', '""', clean_line)
        clean_line = re.sub(r"'.*?'", "''", clean_line)
        
        for char in clean_line:
            if char in chars:
                if char in '{([':
                    chars[char] += 1
                    stack.append((char, i + 1))
                else:
                    match = {'}': '{', ')': '(', ']': '['}[char]
                    chars[char] += 1
                    if not stack or stack[-1][0] != match:
                        print(f"Error: Unexpected closing character '{char}' at line {i + 1}")
                        if stack:
                            print(f"Expected closing for '{stack[-1][0]}' from line {stack[-1][1]}")
                        else:
                            print("No matching opening character found.")
                    else:
                        stack.pop()

    for char, count in chars.items():
        print(f"'{char}': {count}")

    if stack:
        print("\nUnclosed opening characters:")
        for char, line in stack:
            print(f"'{char}' at line {line}")

if __name__ == "__main__":
    check_all_balance('src/pages/admin/ProductRegisterPage.tsx')
