# Changelog

## Unreleased - Last version - January 2026

> Pocket has shut down a few months ago. This is likely to be the very last version of
> InMyPocket. It'll include some changes I made before Pocket shut down, and never
> published. It'll also include changes related to Pocket shutting down, mainly to ease
> the experience of users who still use the addon.

* **Pocket shutdown: add an "export all items" option in the settings**
* Pocket shutdown: disable the authentication screen, and show a notice about Pocket shutdown instead
* Pocket shutdown: show a warning next to the 'disconnect' feature in the settings
* UI: introducing a dark mode, finally! InMyPocket theme will automatically adjust to Firefox selected theme. You're using a dark mode? Then InMyPocket will adapt. You're more of a light mode fan? Fear not, InMyPocket also has you covered!
* UI: change the popup header background from a dark color to a much lighter one, to keep a more consistent light-theme look.
* UI: fix the popup top-action height when the addon is used in sidebar mode, it was way too small and is now more consistent with the regular popup.


## 0.12.24 and 0.12.25 - November 2024

* PERFS: try to reduce (again) the size of items batch we ask Pocket during the initial account sync. Already went from 2k to 1k, now we're moving down to 500 items (0.12.24) and again to 200 items (0.12.25).


## 0.12.22 and 0.12.23 - November 2024

* CHORE: apparently successful API responses _can_ come with error headers. In that case, I now process them like failed responses, triggering error report, logging and feedback to the UI.
* CHORE: successful responses sometimes contain `error` attribute: log it if it happens.
* UI: fix position of the warning message in the popup.


## 0.12.21 - November 2024

* CHORE: still trying to identify the synchronization issue encountered by some users. I suspect a Pocket API change, so here is more error reporting code to dig into this hypothesis.


## 0.12.20 - November 2024

* CHORE: yet another attempt to improve error reporting for failing HTTP requests. Trying to make them easier to group and identify.
* CHORE: relax the rules around alternative URL and improve reporting around this portion of the code.
* PERFS: try to improve long items lists rendering time. The browser should be smart enough to figure out what needs to be rendered, and avoid rendering the whole list all at once.
* PERFS: reduce the size of each items batch we ask Pocket during the initial account sync, as there seem to be performances issues lately and the initial sync often times out. That could at least mitigate this problem.


## 0.12.19 - October 2024

* CHORE: try to improve error reporting for failing HTTP requests and JSON parsing. Trying to make them easier to group and identify.


## 0.12.18 - October 2024

* UPDATE: show a dedicated waiting screen as long as the initial items loading has not completed, instead of the current misleading "No items match this search"
* CHORE: improve warnings and error handling in HTTP requests. They were sometimes lacking in details, which made debugging harder when needed.


## 0.12.17 - July 2024

* FIX: fix the behaviour of "close when added" and "close when read" that were buggy during 0.12.14 and 0.12.15 refactoring


## 0.12.16 - July 2024

* CHORE: cleanup source file paths in my error reporting to provide better and easier grouping of similar error reports.
* CHORE: fix a few technical errors that are currently cluttering my error reporting tool


## 0.12.15 - July 2024

* FIX: version 0.12.14 allowed me to identify the occasional new behaviour of the "add" Pocket API. Not sure why and when it happens, but for now I'm just trying to hotfix this.


## 0.12.14 - July 2024

* CHORE: improve error reporting around the "close tab when added" and "close tab when read" features.
* CHORE: improve error reporting around the "add a new item" feature. Something is wrong/unusual in the responses sent by the Pocket API, but it is still hard to correctly diagnose.


## 0.12.12 & 0.12.13 - July 2024

* CHORE: some users are facing issues when trying to add an item. I'm adding more precise debugging around these actions to try and pinpoint this new problem.


## 0.12.11 - July 2024

* FIX: it seems that Pocket API behaviour has changed lately, leading to some old items potentially appearing at sync time. For that reason, stop relying on supposedly correct default parameter for calls to Pocket API and explicitly ask for unread items during the initial syncs.


## 0.12.10 - July 2024

* UPDATE: in the popup actions at the very top, move the "Refresh list" icon to the left, next to the settings icon. This action is not an action users are supposed to use on a regular basis, and having it right in the middle of other daily actions (such as "add new item" or "pick random item") made it too easy to click on this by mistake.
* FIX: adding a new item sometimes errored due to unknown reasons. I added better error reporting around that function and made it a bit more resilient to unexpected cases.
* CHORE: re-enable more advanced error reporting feature that will allow me to better pinpoint performance problems. As always, these performances reports are only sent if the error reporting setting is enabled.


## 0.12.9 - July 2024

* FIX: debug code during synchronization was incorrectly reporting correct scenarios. I fixed this.


## 0.12.8 - July 2024

* CHORE: make synchronization code hopefully a bit more solid than it was
* FIX: add more debugging information during the synchronization step for more accurate error identification.
* FIX: fix the integration of the error reporting tool I'm using. It wasn't reporting anything anymore.


## 0.12.7 - May 2024

* FIX: settings were sometimes not respected due to some caching issues. Disabled this caching to avoid this kind of bugs. Known bugs: disabling/enabling badge count, disabling/enabling automations, but this is surely the case for almost any configuration option.


## 0.12.6 - February 2024

* FIX: ensuring that entering the edition mode on an item does not alter the item height in the list. The list aspect should now remain more stable when editing an item


## 0.12.5 - December 2023

* UPDATE: technical improvements to the way my bug reporting tool differentiates users


## 0.12.4 - December 2023

* FIX: (partial) correctly highlight icon in address bar on the getpocket site
    * partial because at the moment, it does not work with the `tabs.query` calls since possible urls now contain a `RegExp`
* PERFS: make link opening faster ([contribution from eight04](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/175), thank you!)
* FIX: the perf improvements ensure opening random items will always happen in the correct tab
* FIX: during the authentication flow, close the addon popup after clicking on "Authenticate"


## 0.12.3 - November 2022

* FIX: when clicking the "+" icon in the popup, the item you just added was not added to the list right away. It's now fixed! Thanks for your bug reports that allowed me to spot this one 🙌
* FIX: sometimes, working with items tags was crashing because of an unknown tags value. This is now correctly handled and you should experience fewer problems with tag management


## 0.12.2 - October 2022

* UPDATE: add a keyboard shortcut to open the Pocket list in the sidebar. By default, it's set to Alt+Shift+Q, but feel free to update it with your favorite keyboard shortcut!
* UPDATE: improve the keyboard shortcuts description
* FIX: archiving/deleting the current page item was leaving some free space at the top of the items list. No more!
* PERFS: only send an update request to Pocket API when the item has actually been modified


## 0.12.1 - September 2021

* FIX: using Firefox 82 or earlier versions, the right part of the popup content was not visible (and therefore, action buttons in the item list could not be seen and used at all). This has been fixed


## 0.12.0 - August 2021

* FEATURE: you've been asking for this feature for a very long time, it was a lot of work implementing this right, but here they finally are: tags! You can see them in your items list, and can update them when editing an item. More updates related to tags in the next versions!
* FEATURE: if the current page you're reading is in your Pocket list, this item will now be pinned at the top of the items list, making it much easier to interact with it.
* FEATURE: see this new "pencil" action icon in the items list? It means you can now edit items title and tags right from the popup!
* FEATURE: since version 66 released in March 2019, Firefox provides a dedicated user interface to manage keyboard shortcuts for your addons. I was previously maintaining custom code for this, and had to deal with custom bugs it generated. As of now, keyboard shortcuts will have to be handled through Firefox dedicated page. Have a look at [Mozilla Support: Manage extension shortcuts in Firefox](https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox) for more details
* FEATURE: InMyPocket now has a sidebar mode! You'll find InMyPocket in the addons list in the sidebar, and can now browse while keeping your pocket list conveniently displayed at all times!
* FIX: "close tab when mark as read" automation was actually not closing the tab if item was displayed in reader mode or in the getpocket.com webapp.
* PERFS: improve performances for items list building
* UPDATE: account for the new getpocket.com reader URL format


## 0.11.10 - January 2021

* FIX: error reporting code was generating errors itself. How ironic. This is now fixed.


## 0.11.9 - November 2020

* FIX: normalized paths in stacktrace for better debugging capabilities


## 0.11.8 - November 2020

* FIX: no need for transactions tracing in bug reporting tool. It's now disabled.


## 0.11.7 - November 2020

* FEATURE: add an opt-in setting for automated bug reporting. This is disabled by default but if you want to help me understand what may not be working on your installations of the addon, then you can turn this new setting on!


## 0.11.6 - November 2020

* UPDATE: the websites favicon are now high-resolution! And also, they're fetched through HTTPS now. And they're not coming from Google anymore, but from [DuckDuckGo](https://duckduckgo.com/) instead!
* UPDATE: when you open the popup and the favorite status of an item has changed since last sync, it will immediately reflect in the popup (no need to close and reopen the popup anymore).
* UPDATE: only show the icon in the address bar once you're authenticated. If you're not authenticated, there's no need to show this.
* UPDATE: you can now select a page title or link in the item list, and copy-paste it if you will!
* FIX: when using a touch screen, clicking an item could open it multiple times. Well, thanks to a [contribution](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/159) by [danielrozenberg](https://github.com/danielrozenberg), this has been fixed and is not a problem anymore!
* FIX: remove blue outline that just appeared around the "search" field


## 0.11.5 - May 2020

* UPDATE: the options page was always bright. Even if you were using a dark theme on your OS... and we don't like that! From now on, the addon "Preferences" page should respect the dark theme setting.


## 0.11.4 - May 2020

* FIX: when coupling search and favoriting/unfavoriting items, you could sometimes add inconsistent highlighting of your favorite items, due to an incorrect way of caching the items. I updated the way I compute the cache key, and this problem is now fixed!


## 0.11.3 - April 2020

* FIX: the first item of the list was still partially covered by an element preventing the click. It is now definitely fixed and can be clicked wherever you want to!


## 0.11.2 - April 2020

* FIX: OK, I said I prevented middle-click / right-click to trigger the archive/delete/favorite actions in the popup list. But it also broke the "middle-click opens in a new tab" feature. All is back to normal!
* FIX: left-clicking an item would open it twice. But looks like you want to read your items only once 🙃


## 0.11.1 - April 2020

* FIX: woopsie, the first item of the list was not clickable anymore!


## 0.11.0 - April 2020

* DESIGN: here comes a new shining icon for the InMyPocket project, to get away from the original Pocket one. Hope you'll like it!
* FEATURE: you can now mark items as favorites ⭐️ They will be shown differently in the items list so that they stand out from the items list. Also, I've added a dedicated icon to the popup to show only favorite items from your list, or only not-favorite items. You can also type `is:faved` or `is:unfaved` in the search box to do the same!
* FEATURE: you can now save pages from Firefox reader mode & from the getpocket.com website, thanks to this [contribution from JJ](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/145). Thanks a lot to JJ for his help!
* FEATURE: the first time you fetch your Pocket list, max number of items was capped to 5,000 items due to API restrictions. From now on, subsequent requests will be made to make sure all your items are fetched ([contribution from JJ](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/143), thank you for your help!).
* FEATURE: you can now use right-click to add a bunch of tabs to your pocket list! If you select several tabs and right-click another tab, this one will get added to the pocket list. You'll need to select several tab and right-click one of them. This plays nicely with "close tab after adding to pocket" setting.
* FEATURE: a new automation completes the two existing ones! You can now set IMP to automatically close your tab when you mark the as read / delete it from your pocket list.
* FIX: stop filtering on the protocols of the links, which is not visible in the UI and could therefore provide unexpected results. Searching for "ftp", will return links containing "ftp" in their title or url, and not the "ftp://" links.
* FIX: actions in the items list must be triggered only when left-clicking


## 0.10.6 - June 2019

* FIX: fix middle-clicking and ctrl-clicking on popup items, that was not forcing new tab opening ([contribution from JJ](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/141), thank you for your help!)


## 0.10.5 - April 2019

* FEATURE: 2 new keyboard shortcuts are now available: "open first item" and "open random item", so that you can be even faster to get through your reading list!
* FIX: if title is missing, don't display "null" as a title in the pocket list!


## 0.10.4 - February 2019

* FEATURE: IMP now makes use of the badge on the toolbar icon to show that an action is in progress. This way, you'll know that something is actually happening when you're adding or removing items from your pocket list!
* FIX: on certain platforms, context menu with only one enabled entry was shown inside a submenu, which is not handy. On most recent browsers, context menus will now be hidden instead of disabled, so having one single entry ("Add to pocket") should not create a "In My Pocket" submenu anymore.
* FIX: an issue that could lead to inconsistency in items ordering.


## 0.10.3 - December 2018

* SETTINGS: the "disconnect account" link was previously triggering a confirmation dialog. Instead, use a confirmation link that only appear once you click the "Disconnect" link.


## 0.10.2 - October 2018

* FIX: keyboard shortcut to add new items was not working anymore if the setting "Show 'add to pocket' button in address bar" was disabled. Thanks a ton to Tyler for his help on this.


## 0.10.1 - October 2018

* FIX: middle-click on an item (usually opens the link in a new tab) was broken in 0.10.0


## 0.10.0 - October 2018

* FEATURE: right-click on a tab header will show the same context menus as right-click in a web page, with the same actions (Firefox 60+).
* SETTINGS: you can now customise keyboard shortcuts on the settings page. Keyboard can be defined with Ctrl/Alt/Shift and a letter/digit/fkey (Firefox 60+).
* UPDATE: right-click actions are now properly enabled/disabled in all situations, no more weird states (Firefox 60+).
* UPDATE: from now on, you'll notice a tiny notification when you install InMyPocket. Clicking the notification will redirect you to the FAQ page of the support, for more details about the addon, answers to frequently asked questions, etc.
* FIX: the "Saved" notification on the settings page was sometimes not visible due to scrolling. It's now displayed just next to the settings that was modified so that it's always visible to the user.


## 0.9.4 - June 2018

* DESIGN: updated the addon icon, simpler and more modern!
* UPDATE: before authentication, a message is displayed at the bottom of the popup to explain why you need a pocket account and link to the pocket signup page


## 0.9.3 - May 2018

* FIX: "in my pocket" icon was not visible in FF56 and older
* FIX: the popup user interface was broken when "In My Pocket" was pinned to the overflow menu. Several UI compnents could not be seen. The interface should now adapt correctly, even in the overflow menu.


## 0.9.2 - May 2018

* FEATURE: a new keybard shortcut, to open the popup. Just hit Alt+Q and you'll be right there!
* FIX: the "automatically close a tab when page is added to pocket" automation was not working when adding new items through the "+" button of the popup. Everything's now back to normal!
* FIX: using keyboard shortcut to add a new page with several windows opened could result in unexpected behaviour (sometimes, tabs from an inactive window were added instead of the current tab of the active window).


## 0.9.1 - May 2018

* FIX: the item order was broken when pagination was disabled.


## 0.9.0 - May 2018

* FEATURE: automations! It's a feature long-awaited by many users. Those two automations must be enabled in the settings interface first:
    * FEATURE: automatically close a tab when the page is added into pocket (so that you don't need to manually close the tab).
    * FEATURE: automatically archive links opened from the popup (so that you don't need to manually archive the page once it's been read).
* FEATURE: in the popup interface, add a "clear current search" button inside the filter component.
* UPDATE: errors happen. Sometimes you don't have an internet connection, sometimes Pocket might be unreachable. So far, the only error notification was shown in the popup. From now on, in the toolbar, a red badge flashes when an error occurs so that you know something went wrong, even when the popup is closed.
* UPDATE: when archiving or deleting an item from the popup, the spinner now remains visible until the item is removed, even when you move the cursor around.
* DESIGN: changed the popup ribbon background to a more neutral colour.
* DESIGN: refined the toolbar icon, and added light/dark versions to adjust to the Firefox interface theme you're using.
* DESIGN: added icons to the context menu entries.


## 0.8.1 - February 2018

* FIX: it was not possible anymore to right-click a link and "add it to pocket" if current page was already in the pocket list. This is now fixed!
* FIX: on update, only show notifications for major upgrades (from 0.x.x to 1.x.x) or minor upgrade (from 0.8.x to 0.9.x).


## 0.8.0 - January 2018

* FEATURE: here they are: favicons! The item list now displays the website favicon on the left. It makes items much easier to recognize and the list easier to scan ([contribution from Pavel Gavlík](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/71/feature-add-page-favicon-to-popup/diff), thank you so much for your help!).
* FEATURE: from now on, you'll notice a tiny notification when you update InMyPocket. This will make it much easier for me to notify you of new features, so that you don't miss important stuff.
* UPDATE: pagination gets a little easier with a page selector instead of just next/previous links. Say you have 25 page and need to go to page 14? That's not a problem anymore thanks to [this new contribution from bobi32](https://bitbucket.org/pabuisson/in-my-pocket/pull-requests/78/feature-pagination-pages-selectable-within/diff).
* UPDATE: pagination also gets more clever. Now, when you remove an item from the current page and there are other items on the next page, then the next items is added at the bottom of the page. No more ever-shrinking page!
* UPDATE: settings interface now has an indicator displayed everytime a setting is changed and saved. It was not so obvious before.
* UPDATE: ctrl-click behaviour has been refined. If you ctrl-click a link, it will always open in a new tab, no matter which setting you have for "open link in a new tab". This setting is still in use if you left-click your items though.
* FIX/SETTINGS: pagination was disabled by default, which led to issue on 1st install for users with lots of items. From now on, default for new installs will be "paginate with 50 items per page".


## 0.7.2 - January 2018

* FIX: on popup opening, if popup has not been opened for more than 5 minutes, the filter is reset and the whole list of items is displayed. But in the user interface, the previous value of the filter was still displayed, with an unfiltered list of items, which was both unexpected and weird.


## 0.7.1 - December 2017

* FIX: on popup opening, the construction of the item list was triggered more than once. It was causing performance issues, and might be the cause of several user-interface-related bugs.
* FIX: when the "show items count on badge" option was enabled, the success green check on item add/archive/remove actions was just briefly displayed instead of being visible for 2 seconds
* CHORE: rewrite the way pagination settings are loaded and updated.
* FIX: hopefully, this should be fixing an issue when user opened the popup and immediately updated the filter. Sometimes, depending on the duration it took to reach Pocket API, it could end up with weird behaviours (seeing the saved search, changing it and having it back to the original value once the Pocket API responded)


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
