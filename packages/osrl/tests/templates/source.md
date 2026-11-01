# Custom Filters

[%- capture products -%]
[% js %]
return [
    {
        title:"table",
        type:"kitchen"
    },
    {
        title:"slapstick",
        type:"sextoy"
    }
]
[%endjs%]
[%- endcapture -%]

All products:
[% for product in products %]
- [[ product.title ]]
[% endfor %]

[% assign kitchen_products = products | where: "type", "kitchen" %]

Kitchen products:
[% for product in kitchen_products %]
- [[ product.title ]]
[% endfor %]




# Content of source

Source : [[PRODUCT_ROOT]]

[% assign content = "./widget.osrl" %]

[% assign theATest = "https://wiki.opensourceecology.org/api.php?action=parse&page=OSE_Discord_Channel&format=json" %]

[% assign jsonPath = "$.parse.text[*]" %]

[%- get theATest  before:"JSONParse" path:jsonPath assign:"aTest" after:"markdown" -%]

[[aTest]]

[%- include content html:true assign:"widget" root:PRODUCT_ROOT after:"html,beautify,substitute" -%]

[%- include "${OSR_ROOT}/osrl/tests/templates/widgets/xthumb.osrl" html:true assign:"widget" root:PRODUCT_ROOT after:"html,beautify,substitute" -%]

```
[[widget]]
```

[[var_inner]] // shouldnt be - variable assignment within a widget, leaked

[% assign default_filters = "code,trim" %]
[% assign ai_instruction = "return only the answer, as markdown tables" %]

[% osr-ai model:"gpt-4o" cache:false gui:true logLevel:"debug" filters:default_filters country:"Germany" %]
    [[ai_instruction]]
    Extract all cities except from [[country]] : [[widget]]
    Extract all todos, use markdown: [[widget]]
[% osr-ai-end %]

```mediawiki
[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"debug" filters:default_filters %]
    [[ai_instruction]]
    As mediawiki format [[widget]]
[% osr-ai-end %]
```