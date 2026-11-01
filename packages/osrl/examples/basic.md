## Basic usage

In this example, it's parsing test.html and all included partials :

- it's resolving variables recursively
- resolves parts.csv to a Markdown table
- resolves markdown.md.liquid' to HTML

```js
const parse = require('../index').parseText;
const path = require('path')
const read = require('@plastichub/fs/read').sync;

const template_ = read(`test.html`);

let vars = {
    name: '{{test}}',   // resolved in test
    test: '{{other}}',  // resolved in other
    other: 'alice',
    show: true,
    items: ['first', 'second'],
    objects: [{ att: 'first att' }, { att: 'second att' }],
    recurse_test: true,
    globals: {
        test: 1
    }
};
                
parse(template_, vars, 5, {
    root: [
        path.resolve('./')
    ],
    toHTML:false
}).then(console.log);

```

**Output**

```md

### Test Array:


    Item[items] = first          

    Item[items] = second          


### Test Array with Objects


    item[att] = first att

    item[att] = second att


--- footer.html content ---

### Markdown test

<p>--- markdown.md.liquid to HTML test ---</p>

<h3 id="someheading">Some heading</h3>

### CSV Test



 | Part Nr. | Description      | Configuration                                     | 
|----------|------------------|---------------------------------------------------| 
|          |                  |                                                   | 
| 1        | Heatbands        | 250W ΓÇô 220V \| 110V \| OD:35mm \| Height : 6cm    | 
| 2        | PID Controller   | InkBird 100-VH alice                           | 
| 3        | Power Switch     | IP55 Grade                                        | 
| 4        | Solid Round Bar  | 25mm diameter / 50 cm long                        | 
| 5        | Rack             | Module-3 \| 3cm x 3 cm x 50 cm                    | 
| 6        | Plunger          | 25mm diameter / 38 cm long                        | 
| 7        | Gear Brackets    | 14 cm x 2 cm x 7 cm \| Aluminium \| 25 mm Bushing | 
| 8        | Car ΓÇô Jack       | 20 x 15 cm Mould Plate                            | 
| 9        | Barrel           | 35cm \| ID: 25 mm \| OD: 35 mm                    | 
| 10       | Nozzle Interface | M20 / 12 mm bore                                  | 
| 11       | Nozzle           | M20 / 12 mm bore with inset cone                  | 
|          |                  |                                                   | 
```

With toHTML:true

```html
<h3 id="testarray">Test Array:</h3>
<pre><code>Item[items] = first          

Item[items] = second          
</code></pre>
<h3 id="testarraywithobjects">Test Array with Objects</h3>
<pre><code>item[att] = first att

item[att] = second att
</code></pre>

<p>--- footer.html content ---</p>
<h3 id="markdowntest">Markdown test</h3>

<p>--- markdown.md.liquid to HTML test ---</p>
<h3 id="someheading">Some heading</h3>

<h3 id="csvtest">CSV Test</h3>
<table>
    <thead>
        <tr>
            <th>Part Nr.</th>
            <th>Description</th>
            <th>Configuration</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>1</td>
            <td>Heatbands</td>
            <td>250W ΓÇô 220V | 110V | OD:35mm | Height : 6cm</td>
        </tr>
        <tr>
            <td>2</td>
            <td>PID Controller</td>
            <td>InkBird 100-VH alice</td>
        </tr>
        <tr>
            <td>3</td>
            <td>Power Switch</td>
            <td>IP55 Grade</td>
        </tr>
        <tr>
            <td>4</td>
            <td>Solid Round Bar</td>
            <td>25mm diameter / 50 cm long</td>
        </tr>
        <tr>
            <td>5</td>
            <td>Rack</td>
            <td>Module-3 | 3cm x 3 cm x 50 cm</td>
        </tr>
        <tr>
            <td>6</td>
            <td>Plunger</td>
            <td>25mm diameter / 38 cm long</td>
        </tr>
        <tr>
            <td>7</td>
            <td>Gear Brackets</td>
            <td>14 cm x 2 cm x 7 cm | Aluminium | 25 mm Bushing</td>
        </tr>
        <tr>
            <td>8</td>
            <td>Car ΓÇô Jack</td>
            <td>20 x 15 cm Mould Plate</td>
        </tr>
        <tr>
            <td>9</td>
            <td>Barrel</td>
            <td>35cm | ID: 25 mm | OD: 35 mm</td>
        </tr>
        <tr>
            <td>10</td>
            <td>Nozzle Interface</td>
            <td>M20 / 12 mm bore</td>
        </tr>
        <tr>
            <td>11</td>
            <td>Nozzle</td>
            <td>M20 / 12 mm bore with inset cone</td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </tbody>
</table>
```