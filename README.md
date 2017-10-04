# conex
**this addon is still experimental and lacks hiding / showing tab containers due to https://bugzilla.mozilla.org/show_bug.cgi?id=1384515**

This webextension is a replacement for the discontinued <b>TabGroups</b> with some differences:

# Hyper-experimental

The bug above has a first experiment that implements showing and hiding tabs -- with this, conex is pretty close
to the final functionality. You can install this version of conex, but please be advised that this can break
without warning, so no guarantees.
In order to use conex with the hide / show functionality, do the following (instructions fuzzy as you should only
do it if you know what you are doing):

- enable legacy extension support in FirefoxNightly
- clone https://github.com/autonome/webext-experiment-showOnlyTheseTabs
- load this repos' `experiment` folder as a temporary addon
- click the `.xpi` link on https://github.com/kesselborn/conex/releases/tag/v0.0.57experiment
- in the addon manager, click on the settings icon on `Check for Updates` to get the latest version of conex
- try it out ;)

# Installation

For now, it's probably best to install it from the [github releases page](https://github.com/kesselborn/conex/releases),
as updates are still frequent and the [official addon page](https://addons.mozilla.org/en-us/firefox/addon/conex/)
depends on manual reviews by mozilla. Downloads from here will get updates automatically as well.

# Functionality

- it lacks the big "Manage my TabGroups" overview window
- tab containers are handled like groups in the old tab groups addon
- the quick search containes thumbnail of the results
- the quick search includes the history

Tab Containers need be enabled in the preferences.

# Permissions:

- <all_url>: for taking screenshots for the thumbnails during search
- contextMenus: for context menu for moving tab to a different container
- contextualIdentities: for working with tab containers
- cookies: for working with tab containers
- history: for showing history results in quick search
- storage: for storing thumbnails
- tabs: for tab handling
- unlimitedStorage: for storing thumbnails
- webNavigation: for intercepting and reacting on new tabs

