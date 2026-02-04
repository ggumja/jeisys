const fs = require('fs');
const path = require('path');

const dir = 'd:/Jeisys/src/components/ui';

if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace imports with version suffixes
    // Example: from "@radix-ui/react-tabs@1.1.3" -> from "@radix-ui/react-tabs"
    // Also: from "lucide-react@0.487.0" -> from "lucide-react"

    let modified = false;
    const newContent = content.replace(/from\s+["']([^"']+)@[\d\.]+["']/g, (match, pkg) => {
        modified = true;
        return `from "${pkg}"`;
    });

    if (modified) {
        console.log(`Fixing ${file}`);
        fs.writeFileSync(filePath, newContent);
    }
});

console.log('Import fix complete.');
