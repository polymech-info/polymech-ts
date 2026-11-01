[%capture balls %]
[% endcapture %]
[[balls]]

[% osr-ai model:"gpt-4o" cache:false gui:true logLevel:"warn" filters:"code" %]
    Create a technical illustration, as SVG
    - showing 10 bolts to be screwed into a engine block, animated
    - 5 bolts go into the left side
    - the other 5 bolts into the cylinder heads
    - animate, use shadows
    - create a legend for the parts
    - there's a sexy teacher in the background, with a slap stick
    - make sure it fits all in the screen
    All as SVG, no comments
[% osr-ai-end %]
