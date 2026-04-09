
import re

def trace_nesting(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    level = 0
    for i, line in enumerate(lines):
        opens = len(re.findall(r'<div(?!\w)', line))
        closes = len(re.findall(r'</div', line))
        
        # Self-closing divs like <div /> don't change nesting
        self_closes = len(re.findall(r'<div[^>]*/>', line))
        
        old_level = level
        level += (opens - self_closes) - closes
        
        if level != old_level:
            print(f"Line {i + 1}: {old_level} -> {level} | {line.strip()[:50]}")

if __name__ == "__main__":
    trace_nesting('src/pages/admin/ProductRegisterPage.tsx')
