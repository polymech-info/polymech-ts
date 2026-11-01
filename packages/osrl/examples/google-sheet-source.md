Template Start

{% assign my_variable = false %}
{% assign my_number = 2 %}

{% assign google_sheet_id = '1oVEiGH4o3SV-mAA3Mb-WNVJMyYl4VMxLjWjrSw_ipJY' %}

{% assign google_range_multi = 'Parts!B13:B14' %}
{% assign google_range_named = 'ElenaMargin' %}

{% capture my_capture %}I am being captured.{% endcapture %}

{% capture my_array %}{{ '[{"name":"test"}]' | jsexp }}{% endcapture %}

{% if test %}
    {{test}}
{%endif%}

JS Expression Result : { "Some Invalid Expression" | jsexp }

JS Expression Result 1Kg to lb : {{ "convert(1).from('kg').to('lb')" | jsexp }}
JS Expression Result : {{ "capitalize('uh')" | jsexp }}
JS Expression Result : {{ "tail([2, 3])" | jsexp }}

JS Expression Result : {{ "2+2 " | jsexp }}

JS Result : {{"./test.js" | jseval }}

## Custom tags

### Google - Sheet - Range with iterator

{% googlesheet 'MY_DATASOURCE', id: google_sheet_id, range: google_range_multi , path:'$', assign:'TEST_VAR' %}

{% for item in TEST_VAR %}

    {{item}}

{% endfor %}

Convert to mardown tables:

[[ "markdownTable(TEST_VAR)" | jsexp ]]

Convert to mardown tables and then to html:

{{ "md2html(markdownTable(TEST_VAR))" | jsexp }}

### Google - Sheet - single value

Google Sheet Named Value: {% googlesheet 'MY_DATASOURCE', id: google_sheet_id, range: google_range_named %}

Template End

Scope : {{ 'console.dir(global.scope)' | jsexp }}
