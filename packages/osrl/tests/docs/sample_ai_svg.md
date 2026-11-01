
### Create a SVG Animation

- argument `cache` : cache existing results (only works with `dst` specified).


```js

[% osr-ai model:"gpt-4o" cache:true gui:true logLevel:"warn" filters:"code,trim" dst:"${SRC_DIR}/${SRC_NAME}.svg" %]
    Create a 4 balls, rotating around the outside of a cube, as SVG
     - no comments
     - scale it to 400x400px
     - add another ball bouncing against the inside walls of the cube
[% osr-ai-end %]

```

<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" />
  <circle cx="10" cy="10" r="3" fill="red">
    <animate attributeName="cx" values="10;90;90;10;10" dur="4s" repeatCount="indefinite" />
    <animate attributeName="cy" values="10;10;90;90;10" dur="4s" repeatCount="indefinite" />
  </circle>
  <circle cx="90" cy="10" r="3" fill="blue">
    <animate attributeName="cx" values="90;90;10;10;90" dur="4s" repeatCount="indefinite" />
    <animate attributeName="cy" values="10;90;90;10;10" dur="4s" repeatCount="indefinite" />
  </circle>
  <circle cx="90" cy="90" r="3" fill="green">
    <animate attributeName="cx" values="90;10;10;90;90" dur="4s" repeatCount="indefinite" />
    <animate attributeName="cy" values="90;90;10;10;90" dur="4s" repeatCount="indefinite" />
  </circle>
  <circle cx="10" cy="90" r="3" fill="yellow">
    <animate attributeName="cx" values="10;10;90;90;10" dur="4s" repeatCount="indefinite" />
    <animate attributeName="cy" values="90;10;10;90;90" dur="4s" repeatCount="indefinite" />
  </circle>
  <circle cx="50" cy="50" r="3" fill="orange">
    <animate attributeName="cx" values="50;80;80;20;20;50" keyTimes="0;0.2;0.4;0.6;0.8;1" dur="2s" repeatCount="indefinite" />
    <animate attributeName="cy" values="50;20;80;80;20;50" keyTimes="0;0.2;0.4;0.6;0.8;1" dur="2s" repeatCount="indefinite" />
  </circle>
</svg>


### Create an animated solar system
```js

[% osr-ai model:"gpt-4o" cache:false gui:true logLevel:"warn" filters:"code,trim" dst:"${SRC_DIR}/${SRC_NAME}-solar.svg" %]
    Simluate the solar system, as SVG
    - Each planet should open the link to Wikipedia.
    - all planets rotate around the sun (center), animated, slow, add a thin line for the orbit
    - compact the code, no comments
    - make it all fit to 600x600px
    All as SVG, no comments
[% osr-ai-end %]

```


<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style="background:#000; border:1px solid #000">
  <defs>
    <path id="orbit1" d="M300,300 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0"/>
    <path id="orbit2" d="M300,300 m-80,0 a80,80 0 1,0 160,0 a80,80 0 1,0 -160,0"/>
    <path id="orbit3" d="M300,300 m-110,0 a110,110 0 1,0 220,0 a110,110 0 1,0 -220,0"/>
    <path id="orbit4" d="M300,300 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0"/>
    <path id="orbit5" d="M300,300 m-170,0 a170,170 0 1,0 340,0 a170,170 0 1,0 -340,0"/>
    <path id="orbit6" d="M300,300 m-210,0 a210,210 0 1,0 420,0 a210,210 0 1,0 -420,0"/>
    <path id="orbit7" d="M300,300 m-250,0 a250,250 0 1,0 500,0 a250,250 0 1,0 -500,0"/>
    <path id="orbit8" d="M300,300 m-280,0 a280,280 0 1,0 560,0 a280,280 0 1,0 -560,0"/>
  </defs>
  <circle cx="300" cy="300" r="30" fill="yellow"/>
  <a xlink:href="https://en.wikipedia.org/wiki/Mercury_(planet)" target="_blank">
    <circle r="5" fill="gray">
      <animateMotion dur="30s" repeatCount="indefinite">
        <mpath href="#orbit1"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Venus" target="_blank">
    <circle r="7" fill="orange">
      <animateMotion dur="50s" repeatCount="indefinite">
        <mpath href="#orbit2"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Earth" target="_blank">
    <circle r="8" fill="blue">
      <animateMotion dur="70s" repeatCount="indefinite">
        <mpath href="#orbit3"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Mars" target="_blank">
    <circle r="6" fill="red">
      <animateMotion dur="90s" repeatCount="indefinite">
        <mpath href="#orbit4"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Jupiter" target="_blank">
    <circle r="14" fill="brown">
      <animateMotion dur="110s" repeatCount="indefinite">
        <mpath href="#orbit5"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Saturn" target="_blank">
    <circle r="12" fill="gold">
      <animateMotion dur="130s" repeatCount="indefinite">
        <mpath href="#orbit6"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Uranus" target="_blank">
    <circle r="10" fill="lightblue">
      <animateMotion dur="150s" repeatCount="indefinite">
        <mpath href="#orbit7"/>
      </animateMotion>
    </circle>
  </a>
  <a xlink:href="https://en.wikipedia.org/wiki/Neptune" target="_blank">
    <circle r="10" fill="darkblue">
      <animateMotion dur="170s" repeatCount="indefinite">
        <mpath href="#orbit8"/>
      </animateMotion>
    </circle>
  </a>
  <use href="#orbit1" stroke="white" stroke-width="0.5"/>
  <use href="#orbit2" stroke="white" stroke-width="0.5"/>
  <use href="#orbit3" stroke="white" stroke-width="0.5"/>
  <use href="#orbit4" stroke="white" stroke-width="0.5"/>
  <use href="#orbit5" stroke="white" stroke-width="0.5"/>
  <use href="#orbit6" stroke="white" stroke-width="0.5"/>
  <use href="#orbit7" stroke="white" stroke-width="0.5"/>
  <use href="#orbit8" stroke="white" stroke-width="0.5"/>
</svg>
