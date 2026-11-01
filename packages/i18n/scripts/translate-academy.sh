node ./dist/main.js translate \
--cwd='../hugoplayground2/src' \
--dry=false \
--srcLang='EN' \
--dstLang=$1 \
--debug \
--filters="Hugo" \
--src='../hugoplayground2/src/academy/**/*.md' \
--dst='../osr-kb-test/src/academy/'$1'/${SRC_REL}/${SRC_NAME}${SRC_EXT}'

