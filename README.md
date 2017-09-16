# taborama
**this addon is still experimental and lacks hiding / showing tab containers due to https://bugzilla.mozilla.org/show_bug.cgi?id=1384515**

This webextension is a replacement for the discontinued <b>TabGroups</b> with some differences:

# Installation

For now, it's probably best to install it from the [github releases page](https://github.com/kesselborn/taborama/releases),
as updates are still frequent and the [official addon page](https://addons.mozilla.org/en-us/firefox/addon/taborama/)
depends on manual reviews by mozilla. Downloads from here will get updates automatically as well.

# Functionality

- it lacks the big "Manage my TabGroups" overview window
- tab containers are handled like groups in the old tab groups addon
- the quick search containes thumbnail of the results
- the quick search includes the history

Tab Containers need be enabled in the preferences.

# Permissions:

- <all_url>: for taking screenshots for the thumbnails during search
- contextualIdentities: for working with tab containers
- cookies: for working with tab containers
- history: for showing history results in quick search
- storage: for storing thumbnails
- tabs: for tab handling
- unlimitedStorage: for storing thumbnails
- webNavigation: for intercepting and reacting on new tabs

