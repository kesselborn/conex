# Note: WIP FOR THE NEXT VERSION

## Developer notes:

### Enable debug ui

- open `about:addons` and browse to `Conex / Preferences`.
- on the preferences tab, click 5 times on the  **Keyboard Shortcuts** header and click on the button that
  appears
- set either all components to debug level or select specific components
- open Tools / Browser Tools / Browser Console
- in the Filter field, type "conex" to exclusively filter for conex messages

### Structure:

- one global form that includes all elements
- on root level: ordered list (`ol`) where each list item (`li`) represents a container that
  contains an unordered list (`ul`) where each list item represents a tab
  - class `collapsed`: container tab is shown, tab list is hidden
  - class `no-match`: container tab and tab list hidden
- container element:
  - class `no-match`: hidden
  - class `closed`: dimmed style
