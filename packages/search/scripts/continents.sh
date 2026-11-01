osr-ai chatgpt prompt --query="create a json formatted string, containing an array, with all continents " --dst="./data/continents.json" --append=true --filters=JSON

osr-ai chatgpt prompt --query="create a json formatted string, containing an array, with all major countries in Europe, as list, dont create objects" --dst="./data/europe.json" --append=true --filters=JSON

osr-ai chatgpt prompt --query="create a json formatted string, containing an array, with all major countries in Europe, as list, dont create objects, each country should contain a list of its major cities" --dst="./data/europe.json" --append=true --filters=JSON