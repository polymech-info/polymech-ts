node ./dist/main.js translate \
--cwd='../osr-kb-next/src' \
--dry=false \
--srcLang='EN' \
--dstLang='DE' \
--debug \
--src='${OSR_ROOT}/osr-string-exchange/academy_test/**/*.md' \
--dst='${OSR_ROOT}/osr-string-exchange/academy/${DST_LANG}/${SRC_REL}/${SRC_NAME}${SRC_EXT}'

