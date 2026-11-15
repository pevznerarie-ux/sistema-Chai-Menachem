#!/bin/sh
# Junta os arquivos de src/ em public/index.html
cd "$(dirname "$0")" && (cat src/head.html src/[0-9]*.js; printf '\n</script>\n</body>\n</html>\n') > public/index.html
