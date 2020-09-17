# Todo List

## V1

- [x] Refresh .png cache
- [x] Proper zoom scaling for screen view
- [x] Better drag icons
- [x] Github/Travis CI builds
- [x] Add a changelog
- [ ] Render other types of things?
  - [x] Protoitems
  - [x] Scrollbars
  - [ ] Borders
- [x] Partial extraction based on the assets needed in GUI file
- [x] Extract .tpc files?
- [x] Refactor tree items to components
- [x] Refactor draggable items out of Preview and into components
- [x] Refactor ItemControl into components (was renamed to PropertyList)
- [x] Resize Drag Handles
- [x] Display primitive types like K-GFF
- [x] Name for App (maybe KGE - kotor gui editor)
- [x] No need to download xoreos-tools manually
  - [x] Linux
  - [-] MacOS - No because of signing issues, instead provide instructions on manually building `xoreos-tools`
  - [ ] Windows
- [x] Undo stack
  - [x] Group changes together so that typing into inputs is a single final event. Most likely do diffs to see what was modified and keep updating the old undo stack item
  - [x] Fix undo/redo and selection
- [x] Redo stack
- [ ] Icon for App (place it at `build/icon.png`, 512x512)
- [ ] Clean up UI
  - [ ] Consider prettier inputs/buttons
  - [x] Dark / Light mode
  - [x] Remove sidebar border when nothing open
  - [-] Collapse Settings UI button? Putting them on the same line helped give back real estate already
- [ ] Docs on usage
  - [ ] Specific section on getting MacOs working (need to manually build/install `xoreos-tools` for at least Catalina)

## Post-V1

- [ ] Write typedefs (at least partially)
- [ ] clone/add/delete for nodes/properties?
- [ ] Math in numeric input boxes?
- [ ] Rewrite drag and drop in dom w/o "draggable"? Maybe not so simple :(
- [ ] Automated tests? Maybe, but probably not...
