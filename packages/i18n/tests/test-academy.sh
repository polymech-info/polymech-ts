node ./dist/main.js translate --cwd='../../ph3/academy' \
--dry=false \
--sourceLang='EN' \
--targetLang='DE' \
--debug \
--src='./tests/EN/**/*.md' \
--dst='../i18-tests/academy-de/${SRC_REL}/${SRC_NAME}${SRC_EXT}'
