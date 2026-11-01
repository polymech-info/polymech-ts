# Search CLI

## Installation

```npm i @plastichub/osr-search```

Please create a config file, in your home directory, eg: ```C:\\Users\\TeleTubbie\\.config\\osr\\config.json```, with the following content

```json
{
    "serpapi": {
        "see":"https://serpapi.com/manage-api-key"
        "key": "3747a502f499076d7cab9b0fac48cecef50a440c850fbccd7dac05e89d64d60e"
    },
    "geocode_key":{
        "see": "https://geocode.maps.co/join/ - needed only to convert names into gps coords, for --searchFrom"
        "key": "Your GeoCode Key"
    }
}
```

## Search Google Maps

- `--debug`: Debug messages (default: true)
- `--query`: Query (default: plastichub)
- `--location`: Location (default: defaultFromLocation)
- `--google_domain`: Google domain (default: defaultGoogleDomain)
- `--language`: Language (default: en)
- `--engine`: Engine (default: google_maps)
- `--searchCoord`: Search coord, comma separated: [locationString(home())] (default: [locationString(home())])
- `--searchFrom`: Use this name instead of a coord, needs geocode API key
- `--filterContinent`: Filter results by continent
- `--filterCountry`: Filter results by country
- `--filterType`: Filter results by type, eg "restaurants"
- `--limit`: Limit results
- `--meta`: Append JSON file, with meta data of the found websites, eg: og-image, keywords, description
- `--dst`: Output path, supports XLS|MD (default: ./tests/maps/${QUERY}-${FROM}-${ENGINE}-${DOMAIN}-${LANG}.xls)
- `--env_key`: Environment key to the config path (default: OSR-CONFIG)
- `--api_key` : SERPAPI Key
- `--source` : path to a JSON file, containing categories with related search phrases. To save results per category, use ```--dst='${POLYMECH_ROOT}/campaign/test/${FROM}/${CATEGORY}/${QUERY}-${MM}.xls'```
- `--cache` : when `true`, skip existing search result files
- `--findEMail` : scrape websites for email addresses
- `--meta` : retrieve meta tags, to be stored in JSON only

```
{
  "injection": ["plastique", "recyclage plastique", "fabrication pièces plastiques"],
  "extrusion": ["film plastique", "fabrication tube plastique", "recyclage plastique"],
  "education": ["formation plasturgie", "cours polymères", "recyclage plastique pédagogique"],
  "3d print": ["impression 3d plastique", "imprimante 3d recyclage", "matériau filament plastique"]
}
```


```sh

### example searches

osr-search googlemaps --query="fablab" --searchFrom="Berlin, Germany" --language=de --google_domain=google.de

# this will create by default a file at tests/maps/fablab-Berlin, Germany-google_maps-google.de-de.md, using the default path for --dst './tests/maps/${QUERY}-${FROM}-${ENGINE}-${DOMAIN}-${LANG}.xls'

```

```js

Example searches using SerpAPI [playground](https://serpapi.com/playground?engine=google_maps&q=+inyecci%C3%B3n+de+plastico&ll=%4041.6911354%2C2.1652746%2C9z&google_domain=google.es&hl=es&type=search)

https://serpapi.com/playground?q=+inyecci%C3%B3n+de+plastico&location=Catalonia%2C+Spain&google_domain=google.es&gl=es&hl=es

https://serpapi.com/playground?engine=google_maps&q=+inyecci%C3%B3n+de+plastico&ll=%4041.6911354%2C2.1652746%2C9z&google_domain=google.es&hl=es&type=search

```

# OSR - Search

- [ ] Google - SERP API provider
- [ ] Discourse
- [ ] OSR - Library index
- [ ] API
  - [ ] query
  - [ ] info
  - [ ] test
- [ ] Maps
  - [ ] complete email address using finder.io
  - [ ] scrape website for changes, metrics, ...
  - [ ] find social media accounts
  - [ ] population details
  - [ ] industry (export, ...)
- [ ] osr-ai (langchain) : scrape | summarize
- [ ] site meta dump
- [ ] osr-i18n filter | chain
- [ ] keyword searches/matches/related, see [ahrefs](https://docs.ahrefs.com/docs/api/keywords-explorer%2Foperations%2Flist-related-terms)
- [ ] backlinks, [see api](https://docs.dataforseo.com/v3/backlinks-overview/)

## References

- [Playground](https://app.scaleserp.com/playground)
- [Google SERP API](https://www.scaleserp.com/pricing)
- [Google search query cheat sheet](https://www.makeuseof.com/tag/best-google-search-tips-pdf/)
- [https://drive.google.com/file/d/1EZhzW0rVLjbnn6_lUQXJ1a3bBAydWIne/view](https://www.makeuseof.com/tag/best-google-search-tips-pdf/)
- [IG over FB API](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-profiles-and-media/)


## APIs

- [IG Scraper](https://rapidapi.com/social-api1-instagram/api/instagram-scraper-api2)
- [Search : Perplexity - AI](https://docs.perplexity.ai/reference/post_chat_completions)

