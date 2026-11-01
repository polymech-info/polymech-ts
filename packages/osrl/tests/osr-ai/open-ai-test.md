[%capture continents %]
[% osr-ai assign:"list" model:"gpt-4o" cache:false gui:false logLevel:"trace" filters:"code" dst:"${SRC_DIR}/countries-list.json" source:"${SRC_DIR}/countries.json" %]
Complete all countries with continents
[% osr-ai-end %]
[% endcapture %]

```json
[[continents]]
```

## Continents

[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"warn" filters:"code" %]
List all continents (including russia), as markdown table, columns :
- population
- total gdp
- at war or involved in war
- religion
- number of US bases
- debts
[% osr-ai-end %]

## Africa

[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"warn" filters:"code" %]
List all countries in Africa, as markdown table, columns :

- population
- total gdp
- at war or involved in war
- religion
- number of US bases
- debts
- link to databases, wikipedia, ..
[% osr-ai-end %]

## Europe

[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"warn" filters:"code" %]
List all countries in Europe, as markdown table, columns:

- population
- total gdp
- at war or involved in war
- religion
- political orientation
- number of US bases
- debts
- cost of living
- spoken languages

Do only enter accurate and complete data

[% osr-ai-end %]

## Spain

[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"warn" filters:"code" %]

List all cities in Spain, as markdown table, columns:

- population
- total gdp
- religion
- political preference (party)
- cost of living
- spoken languages
- link to google maps
- exported products

Do only enter accurate and complete data

[% osr-ai-end %]

