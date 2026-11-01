node ./dist/main.js translate \
--cwd='../osr-kb-next/src' \
--dry=false \
--srcLang='EN' \
--dstLang='ES' \
--debug \
--src='../osr-kb-next/src/academy/en/**/*.md' \
--dst='${OSR_ROOT}/osr-string-exchange/academy/${DST_LANG}/${SRC_REL}/${SRC_NAME}${SRC_EXT}'

