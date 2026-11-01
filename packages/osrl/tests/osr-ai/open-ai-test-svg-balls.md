[%capture balls %]
  
[% endcapture %]

[% osr-ai model:"gpt-4o" cache:false gui:true logLevel:"warn" filters:"code" %]
    Create a 4 balls, rotating around a cube, as SVG - no comments
[% osr-ai-end %]
