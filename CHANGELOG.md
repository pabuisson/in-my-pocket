# Changelog

## 0.7.1 - December 2017

* FIX: on popup opening, the construction of the item list was triggered more than once. It was causing performance issues, and might be the cause of several user-interface-related bugs.


## 0.7.0 - November 2017

* FEATURE: pagination: it's the big feature of this new release, which required quite a lot of development and testing, but it should be a huge improvements for users dealing with hundreds or even thousands of items in their pocket list. The feature still needs refinments and enhancements but overall, it's working and should be a huge improvement.
* FEATURE: the current page and filter are temporarily memorized (if you don't open InMyPocket popup for 5 minutes, they're reset), so that you don't need to skip to the same page over and over again!
* FEATURE: many users needed the possiblity to hide the "add to pocket" button from the address bar. You now have a setting for this on the settings page that has been reorganized and made clearer for the occasion :)
* FEATURE: middle-click on an item always open it in a new tab, no matter the "open in a new tab" setting ([contribution from bobi32](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/64/middle-click-on-item-opens-it-in-a-new-tab/diff), thanks a lot!). Handy shortcut!
* DESIGN: aligned the UI with Firefox Photon guidelines for better look and integration. If you're interested, you can find the photo design guidelines over here: [Firefox design guidelines](http://design.firefox.com/photon/).
* CHORE/PERFS: debounced the search field in the popup. In short, it should make text input faster and filter the list only once you're done typing (depending on the speed you usually type, this might make a difference... or not!)
* FIX: "disconnect" feature in the settings page didn't reset user data correctly.


## 0.6.1 - September 2017

* FEATURE: Built a debug mode so that it'll be easier to debug
    * SETTINGS: Switch on/off debug mode


## 0.6.0 - September 2017

* FEATURE: Keyboard shortcut (Alt-W) to add the current page / mark it as read! It's a long awaited feature and many users asked for it: it's here!
* CHORE/PERFS: create items by batches instead of all at a time. Should allow the user interface to be immediately responsive when opening the popup, especially when there's a lot of items there.
* UPDATE: Update action icons
* UPDATE: Add smooth animation when removing an item from the list. Archiving items has never looked this good!


## 0.5.3 - September 2017

* FIX: Fixed filter item feature, was broken in case of undefined page title


## 0.5.2 - August 2017

* CHORE: Update Oauth redirect URL to https


## 0.5.1 - August 2017

* FEATURE: Added a shortcut to open the settings page directly from the popup


## 0.5.0 - July 2017

* FEATURE: Delete an item from your pocket list. Definitely.
* FEATURE: Open a random page now takes filter into account. If you've filtered your list of items and hit "open random page", only pages matching your search can be opened.
* FEATURE:
    * SETTINGS: you find the pocket list font size too small or too big? Now you can select the default zoom level that suits you!
* FIX: Adding a page through context menu was broken ([contribution from adambro](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/40/fix-add-to-pocket-in-context-menu-right/diff), thanks a lot!)


## 0.4.0 - June 2017

* FEATURE: Open a random page from your the pocket list ([contribution from eight04](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/35/page-action-and-some-other-fixes), thanks a lot!)
* FEATURE: Clickable indicator in the address bar, showing if the current page is already in your Pocket list or not ([contribution from eight04](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/35/page-action-and-some-other-fixes), thanks a lot!)
* SETTING: You can now choose if clicked items are opened in the current tab or in a new one ([contribution from eight04](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/35/page-action-and-some-other-fixes), thanks a lot!)
* UPDATE: Design update for the items list, preparing for upcoming features
* FIX: Add the same page more than once now shows a notification message instead of adding the page several times


## 0.3.0 - April 2017

* FEATURE: Add a page by right-click menu: add the current page if you click in the background, add the "target" page if you right-click on a link ([contribution from adambro](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/27/add-to-pocket-from-link-context-menu), thanks a lot !)
* FIX: Prevent from adding same page several times (notice message)
* FIX: Default value of "show badge" options was not taken into account right after addon install
* UPDATE: Highlight badge when adding a new item
* UPDATE: Higher and larger popup


## 0.2.0 - January 2017

* FEATURE: settings page
    * SETTINGS: show/hide the badge on the toolbar icon
    * SETTINGS: disconnect from the Pocket account
* UPDATE: Icon update
* UPDATE: Search displays a placeholder if there are no results (instead of a blank nothing)


## 0.1.0 - October 2016

* FEATURE: Search input to filter the list
* UPDATE: Hide the protocol if http or https, for more useful information in the popup
* UPDATE: Display count badge at first load (when browser has been opened, when user 1st authenticates, etc.)
* CHORE: Reduce log output


## 0.0.4 and 0.0.5 - October 2016

* UPDATE: Better handling of incorrect authentication and errors
* FIX: InMyPocket was sending too many requests to Pocket API


## 0.0.3 - October 2016

* FEATURE: OAuth initial authentication
* FEATURE: Retrieve item list (initial retrieve + incremental retrieve)
* FEATURE: add a link to the list
* FEATURE: open a link
* FEATURE: mark a link as read
* FEATURE: Display the number of unread links in the list
