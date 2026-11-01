node ./dist/main.js translate \
--cwd='../../ph3/academy' \
--dry=false \
--sourceLang='EN' \
--targetLang='FR' \
--debug \
--src='./../../ph3/academy/docs/**/*.md' \
--dst='../osr-kb/academy-fr/docs/${SRC_REL}/${SRC_NAME}${SRC_EXT}'
