# conex
**this addon is still experimental and lacks hiding / showing tab containers due to https://bugzilla.mozilla.org/show_bug.cgi?id=1384515**

See the [experiment version](https://github.com/kesselborn/conex#getting-a-version-that-can-really-hide-tabs) in action here: [conex in action](https://www.youtube.com/watch?v=wTwmIFSnLWY)

[![conex in action](http://img.youtube.com/vi/wTwmIFSnLWY/0.jpg)](http://www.youtube.com/watch?v=wTwmIFSnLWY "conex in action")

This webextension is a replacement for the discontinued <b>TabGroups</b> with some differences:

# Functionality

- it lacks the big "Manage my TabGroups" overview window
- tab groups are implemented via containers
- the quick search containes thumbnail of the results
- the quick search includes bookmarks and history

# Installation

Just install from the [official mozilla addons page](https://addons.mozilla.org/en-us/firefox/addon/conex)

# Getting a version that can really hide tabs

The [mentioned bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1384515) had a [firefox experiment with an api
for hiding & showing tabs](https://github.com/kesselborn/conex/releases/tag/hidetabsexperiment) which makes conex behave as expected.

**Please read**: This works on **FirefoxNightly only** and you must turn off extension signature checking ...
please only proceed if you know what this means:

- in FirefoxNightly open `about:config` and acknowledge the warning. Change the following settings:

    xpinstall.signatures.required: false
    extensions.legacy.enabled: true

- install the [hidetabsexperiment.xpi](https://github.com/kesselborn/conex/releases/tag/hidetabsexperiment) -- you need to acknowledge all the warnings
- install the newest 'experiment' release from the [github conex release page](https://github.com/kesselborn/conex/releases) (something like v0.0.75experiment)

# Permissions:

- <all_url>: for taking screenshots for the thumbnails during search
- bookmarks: for searching in bookmarks
- contextMenus: for context menu for moving tab to a different container
- contextualIdentities: for working with tab containers
- cookies: for working with tab containers
- history: for showing history results in quick search
- menus: for creating context menus when moving tabs
- storage: for storing thumbnails
- tabs: for tab handling
- webNavigation: for intercepting and reacting on new tabs
