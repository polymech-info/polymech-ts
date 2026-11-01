# explicit SW assemblies to HTML via edrawings
# node ./main sw \
# --skip=false \
# --dry=true \
# --debug=true \
# --verbose=true \
# --alt=true \
# --src='./tests/drive/*.+(SLDASM)' \
# --dst='${SRC_DIR}/${SRC_NAME}.+(html)'


node ./main sw \
--skip=true \
--dry=false \
--debug=true \
--verbose=true \
--alt=true \
--src='./tests/drive/*.+(SLDASM)' \
--dst='&{SRC_DIR}/&{SRC_NAME}.+(html)'
