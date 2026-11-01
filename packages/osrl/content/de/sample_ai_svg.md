
### Create a SVG Animation

- argument `skip` : skip existing results (only works with `dst` specified).


```js

[% osr-ai model:"gpt-4o" skip:true gui:true logLevel:"warn" filters:"code,trim" dst:"${SRC_DIR}/${SRC_NAME}.svg" %]
    Create a 4 balls, rotating around the outside of a cube, as SVG
     - no comments
     - scale it to 400x400px
     - add another ball bouncing against the inside walls of the cube
[% osr-ai-end %]

```

<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <style>
    .rotating-ball {
      animation: rotate 4s linear infinite;
    }
    .bouncing-ball {
      animation: bounce 2s infinite;
    }
    @keyframes rotate {
      0% { transform: translate(200px, 200px) rotate(0deg) translate(100px) rotate(0deg); }
      100% { transform: translate(200px, 200px) rotate(360deg) translate(100px) rotate(-360deg); }
    }
    @keyframes bounce {
      0% { transform: translate(50px, 50px) }
      25% { transform: translate(350px, 50px) }
      50% { transform: translate(350px, 350px) }
      75% { transform: translate(50px, 350px) }
      100% { transform: translate(50px, 50px) }
    }
  </style>
  <rect x="0" y="0" width="400" height="400" fill="none" stroke="black" />
  <circle class="rotating-ball" cx="0" cy="0" r="20" fill="red" />
  <circle class="rotating-ball" style="animation-delay: -1s;" cx="0" cy="0" r="20" fill="blue" />
  <circle class="rotating-ball" style="animation-delay: -2s;" cx="0" cy="0" r="20" fill="green" />
  <circle class="rotating-ball" style="animation-delay: -3s;" cx="0" cy="0" r="20" fill="yellow" />
  <circle class="bouncing-ball" cx="0" cy="0" r="20" fill="purple" />
</svg>


### Create an animated solar system
```js

[% osr-ai model:"gpt-4o" skip:false gui:true logLevel:"warn" filters:"code,trim" dst:"${SRC_DIR}/${SRC_NAME}-solar.svg" %]
    Simluate the solar system, as SVG
    - Each planet should open the link to Wikipedia.
    - all planets rotate around the sun (center), animated, slow, add a thin line for the orbit
    - Add a legend with basic information : size, weight, age, make sure it fits in the screen
    - compact the code, no comments
    - make it all fit to 600x600px
    All as SVG, no comments
[% osr-ai-end %]

```


<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style="background-color:black;border:1px solid black">
  <circle cx="300" cy="300" r="20" fill="yellow"/>
  <circle cx="420" cy="300" r="0.5" stroke="gray"/>
  <circle cx="420" cy="300" r="4" fill="gray">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="10s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Mercury_(planet)"/>
  </circle>
  <circle cx="360" cy="300" r="0.5" stroke="gray"/>
  <circle cx="360" cy="300" r="7" fill="gainsboro">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="20s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Venus"/>
  </circle>
  <circle cx="320" cy="300" r="0.5" stroke="gray"/>
  <circle cx="320" cy="300" r="8" fill="blue">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="30s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Earth"/>
  </circle>
  <circle cx="284" cy="300" r="0.5" stroke="gray"/>
  <circle cx="284" cy="300" r="5" fill="red">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="40s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Mars"/>
  </circle>
  <circle cx="230" cy="300" r="0.5" stroke="gray"/>
  <circle cx="230" cy="300" r="14" fill="orange">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="50s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Jupiter"/>
  </circle>
  <circle cx="170" cy="300" r="0.5" stroke="gray"/>
  <circle cx="170" cy="300" r="12" fill="khaki">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="60s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Saturn"/>
  </circle>
  <circle cx="110" cy="300" r="0.5" stroke="gray"/>
  <circle cx="110" cy="300" r="10" fill="lightblue">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="70s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Uranus"/>
  </circle>
  <circle cx="50" cy="300" r="0.5" stroke="gray"/>
  <circle cx="50" cy="300" r="9" fill="blue">
    <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="80s" repeatCount="indefinite"/>
    <a xlink:href="https://en.wikipedia.org/wiki/Neptune"/>
  </circle>
</svg>
