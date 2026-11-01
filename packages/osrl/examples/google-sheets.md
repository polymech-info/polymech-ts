# Support for Google - Sheets

Reading values from Google sheets can be done as follows

```liquid

{% googlesheet 'MY_DATASOURCE', id: '1oVEiGH4o3SV-mAA3Mb-WNVJMyYl4VMxLjWjrSw_ipJY', range: 'Parts!B4:B5', path:'$', assign:'TEST_VAR' %}

{% for item in TEST_VAR %}
    {{item}}
{% endfor %}

```

**Parameters**

- 'MY_DATASOURCE' : is just a name, currently used to cache the connection for later usage
- ```'id'``` : the Google Sheet ID (see browser address bar)
- ```'range'``` : the range in the sheet, eg: 'NamedField', or a particular range on a specific sheet : 'Parts!B4:B5'
- ```'path'``` : optional, a jsonpath query (check [jsonpath online editor](https://jsonpath.com/))
- ```'assign'``` : optional, assign the result to a new variable. in this case, the tag returns nothing !

**Example** [see source in './google-sheet-source.md'](./google-sheet-source.md)

**Output**

```markdown

Template Start

JS Expression Result : 4

JS Result : cool ! my_number = 2

JS Expression Result : { "Some Invalid Expression" | jsexp }

JS Expression Result 1Kg to lb : 2.2046244201837775
JS Expression Result : Uh
JS Expression Result : 3

## Custom tags

### Google - Sheet - Range with iterator

    120x60 x 3

    120x60

### Google - Sheet - single value

Google Sheet Named Value: 479

Template End
```