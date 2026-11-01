https://www.bannerbear.com/blog/how-to-create-a-slideshow-from-images-with-ffmpeg/

```sh
    ffmpeg -framerate 1/3 -i img%03d.jpg -r 25 -c:v libx264 -pix_fmt yuv420p output.mp4
```

