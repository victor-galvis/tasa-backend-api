const fs = require("fs");
const path = require("path");

function copyFolderSync(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const file of fs.readdirSync(from)) {
        const srcPath = path.join(from, file);
        const destPath = path.join(to, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const srcTemplates = path.join(__dirname, "src", "mail", "templates");
const distTemplates = path.join(__dirname, "dist", "mail", "templates");

copyFolderSync(srcTemplates, distTemplates);

console.log("✅ Templates copiados a dist/mail/templates");
