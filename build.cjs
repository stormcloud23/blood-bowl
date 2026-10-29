// Keep root-of-main GitHub Pages deployment buildless: embed the tested engine.
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const engine = fs.readFileSync('movement.cjs', 'utf8').trimEnd();
const match = fs.readFileSync('match.cjs', 'utf8').trimEnd();
const skills = fs.readFileSync('skills.cjs', 'utf8').trimEnd();
fs.writeFileSync('index.html', html.replace(/<script id="movement-engine">[\s\S]*?<\/script>/, () => '<script id="movement-engine">\n' + engine + '\n</script>').replace(/<script id="skills-engine">[\s\S]*?<\/script>/, () => '<script id="skills-engine">\n' + skills + '\n</script>').replace(/<script id="match-engine">[\s\S]*?<\/script>/, () => '<script id="match-engine">\n' + match + '\n</script>'));

