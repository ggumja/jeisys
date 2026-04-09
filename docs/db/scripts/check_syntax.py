
import re

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    div_opens = len(re.findall(r'<div', content))
    div_closes = len(re.findall(r'</div', content))
    
    print(f"<div> opens: {div_opens}")
    print(f"</div> closes: {div_closes}")
    
    # Check for unclosed curly braces in JSX
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if char == '{':
                stack.append(i + 1)
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {i + 1}")
    
    if stack:
        print(f"Unclosed opening braces starting at lines: {stack}")

if __name__ == "__main__":
    check_balance('src/pages/admin/ProductRegisterPage.tsx')
