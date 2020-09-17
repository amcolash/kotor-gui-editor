# kotor-gui-editor

A tool to make editing the GUI of KotOR visual and simpler

Requires having a few tools from [xoreos-tools](https://github.com/xoreos/xoreos-tools).

## Screenshots

<img src="https://raw.githubusercontent.com/amcolash/kotor-gui-editor/master/screenshots/dark.png" height="500"/>

<img src="https://raw.githubusercontent.com/amcolash/kotor-gui-editor/master/screenshots/light.png" height="500"/>

## Basic Usage

This application allows for modifying KotOR (and possibly TSL) `.gui` files. In general I tried to make the UI intuitive and easy enough to follow. Make a issue if you need more detailed docs.

### Load in Game Assets

In order to load in game images, you will need to extract them using [KotOR Tool](https://deadlystream.com/files/file/280-kotor-tool/) by Fred Tetra. Load up `ERF's > Texture Packs > swpc_tex_gui.erf` (pretty sure that's the UI file, it's midnight...) and then extract all images into a folder - it can be a new folder anywhere. You will now have a folder with a bunch of `.tpc` files. My tool will read `.tpc` or `.tga` files!

<img src="https://raw.githubusercontent.com/amcolash/kotor-gui-editor/master/screenshots/erf.png" height="200"/>

What I would recommed doing is:

1. Extract the original ui assets into a folder
2. Download HD assets (if desired) and add those files to the same folder, replacing if needed. I would recommend [these](https://deadlystream.com/files/file/1457-hd-menus-and-ui-assets/) form JackInTheBox
3. Open up your asset folder and promit!

Finally, once you are all set with the images you just need to open any `.gui` file. There are two routes here:

1. These are also easily extractable from the game `BIF's > gui.bif` and similary, extract all files to a new directory.
2. Open existing `.gui` files from a widescreen mod - such as [this](https://deadlystream.com/files/file/1159-kotor-high-resolution-menus/) from ndix UR, and modify from there.

<img src="https://raw.githubusercontent.com/amcolash/kotor-gui-editor/master/screenshots/bif.png" height="200"/>

From here, it is mostly drag + drop or modifying values in the input boxes in the sidebar.

Once you are ready to save, there is a save button. It will make a backup of the original `.gui` file (for now)

## Mac OS Specific

The latest few mac releases (Catalina specifically) make using the program much harder. If you still want to try, you will need some comfort with a terminal and will need to have `xocde` and `homebrew` installed.

1. Grab a copy of `xoreos-tools` from https://github.com/xoreos/xoreos-tools (source code, not a release)
2. Extract the source code
3. Install a few things (I think that is all that is needed): `$ brew install make cmake automake boost`
4. Make it `$ ./autogen.sh && ./configure && make`
5. Install the tools `$ sudo make install`

Once you have those tools in your `PATH`, you should be all set to go using my tool!

## Something Broken?

If you find a bug, please let me know on the [deadlystream post](https://deadlystream.com/topic/8226-visual-kotor-gui-editor-kge) or make an issue on Github!

## Building Yourself

```bash
# install dependencies (before anything else)
npm install

# run application in development mode
npm run dev

# compile source code and create webpack output
npm run compile

# `npm run compile` & create build with electron-builder
npm dist

# `npm run compile` & create unpacked build with electron-builder (similar for specific os builds. e.x. npm run dist:linux)
npm run dist:dir
```
