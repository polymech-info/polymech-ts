node ./main.js compile \
    --debug=true \
    --source='${root}/osr/bazar/root.html' \
    --root='../../ph3/products' \
    --product=$1  \
    --profile='${root}/.osrl.json' \
    --output='${root}/${product}/bazar/output.html' \
    --plugins='${root}/osr/plugins' \
    --env='bazar' \
    --format='html' \
    --stdout=false \

node ./main.js compile \
    --debug=true \
    --source='${root}/osr/bazar/preview.osr' \
    --root='../../ph3/products' \
    --product=$1  \
    --profile='${root}/.osrl.json' \
    --output='${root}/${product}/bazar/output_preview.html' \
    --env='bazar' \
    --format='html' \
    --stdout=false \

node ./main.js compile \
    --debug=true \
    --source='${root}/osr/bazar/post.osr' \
    --root='../../ph3/products' \
    --product=$1  \
    --profile='${root}/.osrl.json' \
    --output='${root}/${product}/bazar/output_final.html' \
    --env='bazar' \
    --format='html' \
    --stdout=false \
