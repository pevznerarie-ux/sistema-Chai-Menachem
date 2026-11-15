#!/bin/sh
# Monta as duas páginas a partir de src/:
#   public/app.html    = sistema real (login e banco de dados)
#   public/previa.html = prévia com dados de exemplo
set -e
cd "$(dirname "$0")"
mkdir -p public
CORE="src/01-core.js src/02-data.js src/03-ui.js src/04-cadastro.js src/05-yahrzeit-fin.js src/06-eventos-com-rel.js src/07-relac.js src/08-fin-vida.js src/09-portal-config.js"
{ cat src/head.html; echo 'const PREV=false;'; cat $CORE src/10-real.js; printf '\n</script>\n</body>\n</html>\n'; } > public/app.html
{ cat src/head.html; echo 'const PREV=true;'; cat $CORE src/99-init.js; printf '\n</script>\n</body>\n</html>\n'; } > public/previa.html
