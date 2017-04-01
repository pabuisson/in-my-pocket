# Changelog


## [unreleased]

* FEATURE: Add a page by right-click menu: add the current page if you click in the background,
  add the "target" page if you right-click on a link
* FEATURE: Highlight badge count when adding a new item
* FIX: Prevent from adding same page several times (notice message)
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
