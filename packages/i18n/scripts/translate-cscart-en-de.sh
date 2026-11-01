node ./dist/main.js translate \
--dry=false \
--srcLang='EN' \
--dstLang='DE' \
--debug \
--keys='full_description' \
--src='${OSR_CACHE}/cs-cart/latest/en/*.json' \
--dst='${OSR_CACHE}/cs-cart/latest/${DST_LANG}/${SRC_NAME}${SRC_EXT}'

