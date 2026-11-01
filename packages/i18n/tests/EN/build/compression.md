---
title: Compression Machine
categories: ["machines"]
tags: ["DIY"]
toc: true
nav: kb
menu:
  kb:
    parent: build
    weight: 20
---


{{< youtube ogI8kt0w43Y >}}



# Build a Compression Machine

## What is this machine?

The compression machine is basically an electric kitchen oven to heat the plastic, and a compression mechanism (a carjack) to apply pressure to your mould. The process is slower than the other Precious Plastic machines but it allows for larger moulds to be used. It can be used to create raw material, like sheets or shapes that can be further worked on to make new products and gives a specific flake-like look to the plastic (which looks amazing!).


Tip : The compression machine is good for testing and trying. But for steady production we advise an extrusion or injection machine

## Video Chapters

- 00:00 Introduction
- 00:39 Make the oven
- 03:51 Framework
- 04:55 Press system
- 08:02 Electronic
- 11:21 How it works

# Technical information

Type | Compression Machine
--- | ---
 Version | 2.0
Price new material in NL | +/- €350
Price scrap material in NL | +/- €150
Weight | 30 kg
Dimensions | 500 x  590 x 1590 mm
Compression | 2t car jack
Voltage | 220V
AMP | 2.6A
Input Flake Size  | Medium, Small  |


# 3D Model

<iframe width="500" height="500" src="https://b2b.partcommunity.com/community/partcloud/embedded.html?route=embedded-viewer&name=Compression+Basic+V2.0&model_id=96647&portal=b2b&noAutoload=false&autoRotate=false&hideMenu=true&topColor=%23dde7ed&bottomColor=%23ffffff&cameraParams=false&varsettransfer=" frameborder="0" id="EmbeddedView-Iframe-96647" allowfullscreen></iframe>




# Required machinery & skills
Build Compression  | Machines needed | Skills needed
--- | ---| ---
<img style="" src="/build/thumb-compression.jpg" loading="lazy" class="mr-3"/>  | - Drill press 
 - Welding machine (not specific) 
 - Angle grinder | - Welding (intermediate) 
 - Assembling (intermediate) 
 - Electronics (intermediate)

# Electronic box

Explanation of the electric components inside this machine. More information and schematics can be found in the download-kit.

* <b>PID Controller:</b> the brains of the machine where you can set your desired temperatures. It will send power to the heaters until PV (point variable) matches the SV (set value). It does this using readings from the thermocouple and the SSR.
* <b>SSR:</b> the Solid State Relay is an electronic ‘switch’ that opens and closes depending on the signal it receives (from the PID).
* <b>Thermocouple:</b> basically a thermometer.
* <b>Band heater:</b> heating element that fits around a pipe.
* <b>Power switch:</b> mechanical switch.
* <b>LED indicator:</b> LED that will shine with power (often found with Power switch).
* <b>Power cable:</b> common household power cable.

Tip : Here is a [good forum topic about electronics](https://forum.osr-plastic.org/t/the-big-electronics-topic/)

# Tips & tricks while making

- Look around for second hand or scrap ovens.
- Try to make the hole into the oven only as big as it needs to be. This will save on insulation.
- Have a look at the Compression v2.1 update before diving into these plans.

# Input & Output

<b>Type:</b> HDPE, LDPE, PP, PS

<b>Output:</b> 1 part per 40 minutes. Depends largely on the mould.

# Run & maintain

The compression is simple to understand and very powerful if properly mastered. It can be operated by one person alone most of the time. Once again, the creation process is very connected with moulds and mould making. If you have a precise mould you can create beautiful products. The mould we provide is very basic so everyone can understand the pro- cess but we highly encourage you and the team to look into making new moulds that can be useful in your area.

# How to operate the compression               

## Startup

1. Turn the oven on and set the desired temperature.
2. Wait 20 minutes for the desired temperature to be reached.

## Production

1. Weigh the required amount of material for your moud + 20%.
2. Fill the mould with material.
3. Put the upper part of the mould on the plastic.
4. Put the mould in the oven.
5. Leave it for 15 minutes.
6. Turn the mould 180° in the oven.
7. Leave it for another 15 minutes.
8. Compress the mould.
9. Take the mould out of the oven.
10. Put clamps on the mould to keep the pressure.
11. Place another mould in the oven.

## Cooldown

1. Clean the inside of the oven from molten plastic.
2. Tips & tricks while using
3. It is advisable to heat up the plastic until melted and then apply pressure.
4. Don’t be hasty, make sure the plastic is fully melted in the mould.

# Troubleshooting

- Plastic over-flows from one side of the mould. This is often the result of misalignment between the mould, pressing plate or the oven itself. Make sure everything is as much as possible parallel to the ground.
- Product gets stuck to the mould. Try softly heating the mould to ease the release or try to apply a layer of mould-release to the mould.

# Pros & cons

Pros | Cons
--- | ---
Easy to manufacture     | Process is slow
Can use found oven | Mould size limited to oven
Runs on 220V |  Not energy efficient
Bigger products than injection    |
Unique patterns |  

# Built by the community

<div class="j-slideshow">

![Community Compression](/build/community/compression3.jpg)

![Community Compression](/build/community/compression1.jpg)

![Community Compression](/build/community/compression2.jpg)

</div>


## Related
- [Upgrade: Compression V2.1 - Library](/howtos/compression-machine-21)
- [Compression](https://forum.osr-plastic.org/t/machine-development-compression-oven/)
- [Solar Powered Melting Machine](https://forum.osr-plastic.org/t/solar-powered-melting-machine/)
- [How-to: Wall Clock- YouTube](https://www.youtube.com/watch?v=e_jqIvSFfI4)
