#!/bin/bash
language="osr"
debug=true
expand=true
source="./tests/templates/source.md"
template="./tests/templates/template.md"
output="./tests/templates/output.html"
root="./tests/templates"
profile="${OSR_ROOT}/osr-templates/osrl/.osrl.json"
plugins="${root}/osr/plugins"
env="library"
format="html"
stdout=true
logLevel="trace"

node --no-warnings main.js compile --language="$language" \
             --debug="$debug" \
             --expand="$expand" \
             --source="$source" \
             --template="$template" \
             --output="$output" \
             --root="$root" \
             --profile="$profile" \
             --plugins="$plugins" \
             --env="$env" \
             --format="$format" \
             --stdout="$stdout" \
             --logLevel="$logLevel"
