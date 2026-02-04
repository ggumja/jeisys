const fs = require('fs');
try {
    fs.unlinkSync('d:/Jeisys/src/routes.ts');
    console.log('Successfully deleted routes.ts');
} catch (err) {
    console.error('Error deleting file:', err);
}
