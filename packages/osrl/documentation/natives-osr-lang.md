# Native - types & mappings

- Number - Int
- Number - Float
- String
- Date -> (string)
- TimeStamp -> (uint)
- Duration -> (uint)
- Struct -> (uiid string to resolve type)
- Type -> string (type type information)
- Ref -> struct [string|string, struct<any>]
- Vector2D -> struct [Float,Float]
- Vector3D -> struct [Float,Float,Float]
- BBox -> struct [Vector3D,Vector3D]
- Quaternion -> struct [Float,Float,Float,Float]
- Flags -> map<string, ulong>
- Expression -> string | struct [string|RegEx, options:flags]
- Boolean
- Options -> struct [flags|struct<any>]
- Url -> string
- Url-Scheme -> struct [Url,options:struct<any>]
- Asset -> struct [Url-Scheme, options:struct<any>]

- Selector > Expression | struct [Expression,options:struct<any>]

- Symbol -> ulong
- Type -> struct[string,Symbol] (type type information)
- Value -> Symbol
- Values -> map<string,value>
- Attribute -> struct [Type, Value]
- Parameter -> struct [Type,Value]
- Operation -> Symbol
- ParameterOperation -> struct [Value,Value,Operation]

- Template ->  string | struct [Type|Selector,options:struct<any>]
- Arguments -> struct <any> | [...any]

## Examples

```md

# My Item

## Details

<template name="item_detail" arguments="showReferences=false">

Some text ...

</template>


<values comment="external and static values">
    <value name="bushing-sheet" value="13PuCx8zKUjXvofFYBGzoOYog7UHpvLzCgxMLF9INnr8"/>
    <value name="bushing-summary" value="0"/>
    <value name="TOTAL" value="3"/>
    <value name="Avg" value="g-sheet://<%bushing-sheet%>/<%bushing-summary%>/D11"/>
</values>

<attributes>
    <attribute name="roundtrip" value="<% TOTAL / 3 %>"/>
</attributes>

```

## Url schemes

### Google sheet value

**short code** : g-sheet

**brief** : Obtains value(s) in expressions (anywhere) from Google sheets.

**parameters** : We pass trough all Google API / Url parameters. See [more](https://webapps.stackexchange.com/questions/44473/link-to-a-cell-in-a-google-sheets-via-url).

**examples**

```md
Estimated cost : <% VariableName / g-sheet://id/gid/range %>
```

### PP Search

**short code** : search

**brief** :

Returns a collection of *PP Search* results

**parameters**

We pass trough all Url parameters but the more common format is :

search://source/query/options

search://source/query/except={author=anonymous}

**examples**

```md

Display forum search results inline with preview  

<search name="filament" query="filament" sources="Forum|Academy|Wiki">
    <option name="display" value="inline"/>
    <option name="preview" value="true"/>
    <options for="google">
        <options for google api here>
    </options>

    <options for="amazon">
        <options for amazon api here>
    </options>

    <options for="forum">
        <options for forum here>
    </options>

</search>

```

### VFS

**short code** : vfs

**brief**

Short code to display or reference files or folders on various
virtual file systems as Github, local or SSH

**parameters**

We pass trough all VFS parameters but the more common format is :

vfs://mount/file

vfs://mount/root folder/sub folder/filename.md?display=inline|reference

**examples**

```md

Display the content of another file

<vfs name="my-file-definition" path="readme.md" mount="workspace" options="display=inline">
    <option name="display" value="inline">
    <option name="processor" value="HTML">
    
    <!-->Set option for version selection - only provided by certain VFSs as Github<-->
    <option for="github">
        <option name="branch" value="#development">
    </option>
</vfs>


Display the list of files in a folder
```md
<vfs name="my-file-definition" path="some folder" mount="workspace" options="display=inline, layout=grid">
    <option name="display" value="inline">
    <option name="processor" value="HTML">
</vfs>
```

It's recommended to store the definitions instead in the template's store file
and then use the reference just. Override arguments is possible as well

```md
<vfs ref="CAD files" options="display=inline, layout=list"/>
```

## Filters

**short code** : filter

**brief** :

Short code to filter out content using the built-in expression engine or markup friendly expressions

```md
<filter operation="equal" value1="user.group" value2="administrator">
    admin stuff here
</filter>

<filter expression="{% user.group == administrator %}">
    admin stuff here
</filter>

```

For repeating filters and using them as Url arguments, it's advised to store them
in the template's store file.

```md
<filter name="kingpin" expression="{% user.group == administrator %}">
    {%content%}
</filter>

<text filter="kingpin">
    trust me, and only me !
</text>
```

## Parameter Operations

**short code** : operation

**brief**

In some cases content or values are not in the right format. This system provides per type a set of parameter operations which has 3 inputs : operation, value1 & value2 (optional).

```html
<filter expression="<% system.config.units === 'metric' %>" >
    The thing is 
        <operation op="meter" value1="200"/> 
    <%system.config.units%> high ..
</filter>
```

## Replace

**short code** : replace

**private**

**brief**

Way to modify anything - should be used as last resort only.

```html

<replace name="named object" or classes="object, template" or selector="" attribute="attribute to change" path="inner path, ie: jsonpath" expression="">
    the replacement
</replace>

```

## remote

**short code** : remote

**private**

**brief**

Returns remote content

```html

<remote name="name for later" site="url" parser="jsdom|cheerio|json" selector="some CSS or $ selector" query="inner query, ie: jsonpath">
    <option name="some url parameter to add - easier here" value=""/>
</remote>
```

## Resource

**short code** : resource

**brief**

Pull in HTML and system related resources

```html

<resource name="name for later" enabled="{% system.config.debug %}" src="URL|PATH|VFS" type="CSS|SCRIPT-HEAD|SCRIPT-BODY|SCRIPT"/>

```

## Extension

**short code** : extension

**brief**

Extension points enable extending existing templates for 3th party additions

```html

<extension for="welding-skill" place="after|before|**first**|last">
    my extra content
</extension>
```

In a template

```html
<list name="welding-skill">
    <!--extension will be placed here-->
    <requirement>{%MIG_WELDING_LABEL%}</requirement>
</list>
```

<hr/>

Implicit & inherited base attributes:

- *view* : shorthand filter to make the node only visible for a certain compiler target
- *widget* : widget class
- *widgetOptions* : named widget options
- *filter* : named filter
- *id* : unique auto id "tag-name|counter"
- *vfs* : if set content will be loaded from this url
- *name* : if set, this unique name registers the object in the global class instance map. this attribute
 is being also used for wiring extensions.
- *acl* : default's to any
- *remote* : if set, content will be loaded from this url
- as well all HTML attributes
