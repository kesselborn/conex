# taborama
**this addon is still experimental and lacks hiding / showing tab groups due to https://bugzilla.mozilla.org/show_bug.cgi?id=1384515**

This webextension is a replacement for the discontinued <b>TabGroups</b> with some differences:

# Installation

For now, it's probably best to install it from the [github releases page](https://github.com/kesselborn/taborama/releases),
as updates are still frequent and the [official addon page](https://addons.mozilla.org/en-us/firefox/addon/taborama/)
depends on manual reviews by mozilla. Downloads from here will get updates automatically as well.

# Functionality

- for now it lacks the big "Manage my TabGroups" overview window
- a tab group is automatically one tab container -- i.e. tab groups are isolated against each other
- the quick search containes thumbnail of the results
- the quick search includes the history

Tab Containers need be enabled in the preferences.

# Permissions:

- <all_urls&gt>: for taking screenshots for the thumbnails during search
- contextualIdentities: for working with tab groups
- cookies: for working with tab groups
- history: for showing history results in quick search
- storage: for storing thumbnails
- tabs: for tab handling
- unlimitedStorage: for storing thumbnails
- webNavigation: for intercepting and reacting on new tabs

