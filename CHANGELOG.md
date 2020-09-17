# Changelog

This changelog keeps track of most (except early development) changes to the tool

## 0.0.3: 09-14-2020

### Added

- Undo/Redo stack, working about 90% - there are some quirks but good enough to release
- Portable build for windows
- Attempt to use local version of `xoreos-tools` if they are in `PATH`
- Error messages shown to user instead of silently failing
- Dark Mode - Cuz I'm Batman!

### Updated

- No longer need to reference `xoreos-tools` directory, tools are bundled in
- Remove default electron menu, keep dev tools shortcut + add a nice debug icon (just in case we need logs)
- Clean up the UI a bit

### Fixed

- Escape all file paths to try and make things better cross platform

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
