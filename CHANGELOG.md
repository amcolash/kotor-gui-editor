# Changelog

This changelog keeps track of most (except early development) changes to the tool

## 0.0.5: 09-17-2020

### Added

- Add in simple type defs for GFF data. Not perfect, but much better than using `any` everywhere!

### Fixed

- Zoom now updates whenever data changes - not only when dragging an item (i.e. undo/redo/type in)

## 0.0.4: 09-17-2020

### First Public Release!

### Added

- List of licenses used to UI

### Updated

- A few small UI tweaks
- Refactor of some code

### Fixed

- Outline + handles in preview are correctly scaled based on zoom

## 0.0.3: 09-17-2020

### Added

- Undo/Redo stack, working about 90% - there are some quirks but good enough to release
- Portable build for windows
- Attempt to use local version of `xoreos-tools` if they are in `PATH`
- Dark Mode - Cuz I'm Batman!
- A shiny new app icon
- Screenshots + Docs

### Updated

- No longer need to reference `xoreos-tools` directory, tools are bundled in - may not work on all versions of OSX
- Remove default electron menu, keep dev tools shortcut + add a nice debug icon (just in case we need logs)
- Clean up the UI so things are just a little prettier

### Fixed

- Escape all file paths to try and make things better cross platform
- Error messages shown to user instead of silently failing
- CI builds were not set explicitly to use lfs (though unix seemed ok...)

## 0.0.2: 09-13-2020

### Added

- Drag handles to resize items
- Support for extracting images from `.tpc` files
- Missing data type controls (`uint32`, `double`, and `float`)

### Updated

- Various UI tweaks
- Only do a partial extraction of images based on the `.gui` file
- Refactor `Preview`, `PropertyList`, and `Tree` children out to clean up codebase

## 0.0.1: 09-13-2020

### Added

- First release w/ CI, much more to do - see `TODO.md`
