#

## Developer notes:

Structure:

- one global form that includes all elements
- on root level: ordered list (`ol`) where each list item (`li`) represents a container and contains an unordered list (`ul`) where each list item represents a tab
  - class `collapsed`: container tab is shown, tab list is hidden
  - class `no-match`: container tab and tab list hidden
- container element:
  - class `no-match`: hidden
  - class `closed`: dimmed style
