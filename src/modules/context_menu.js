"use strict"

import Logger from "./logger.js"

// Before Firefox 55 this API was also originally named contextMenus, and that name has been
// retained as an alias, so you can use contextMenus to write code that works in Firefox and
// also in other browsers.
// To use this API you need to have the "menus"  permission (or "contextMenus" for the alias)

const ContextMenu = (function () {
  function enable(id) {
    Logger.log(`(ContextMenu.enable) enable ${id} context menu`)

    const promiseEnable = browser.contextMenus.update(id, { enabled: true })
    const promiseVisible = browser.contextMenus.update(id, { visible: true })

    return Promise.all([promiseEnable, promiseVisible])
  }

  function disable(id) {
    Logger.log(`(ContextMenu.enable) disable ${id} context menu`)

    const promiseEnable = browser.contextMenus.update(id, { enabled: false })
    const promiseVisible = browser.contextMenus.update(id, { visible: false })

    return Promise.all([promiseEnable, promiseVisible])
  }

  // "tab" context does not exist for chrome and older firefoxes, feature will be broken for them
  function getAvaiableContexts() {
    const availabeContexts = browser.contextMenus.ContextType
    const contexts = [availabeContexts.PAGE, availabeContexts.LINK]

    // Use the tab context only if it exist and if we can update the context menus when it's shown
    // (right-clicking on a tab in Pocket must display different state then a tab not in pocket)
    if (availabeContexts.TAB && browser.contextMenus.onShown) {
      contexts.push(availabeContexts.TAB)
    }

    return contexts
  }

  return {
    addId: "inmypocket-add-item",
    archiveId: "inmypocket-archive-item",
    deleteId: "inmypocket-delete-item",

    // TODO: this state should not be defined here, but in another module
    //       A dedicated PageState module? Or a more "Item"-oriented module?
    pageAlreadyInPocket: "PAGE_ALREADY_IN_POCKET",
    pageNotInPocket: "PAGE_NOT_IN_POCKET",
    multipleTabSelection: "MULTIPLE_TABS_SELECTION",

    createEntries: function () {
      Logger.log("(ContextMenu.createEntries) create all right-click entries")
      browser.contextMenus.create({
        contexts: getAvaiableContexts(),
        id: ContextMenu.addId,
        title: "Add to Pocket",
        icons: {
          16: "assets/icons/ionicons-android-add-circle.svg",
        },
      })
      browser.contextMenus.create({
        contexts: getAvaiableContexts(),
        id: ContextMenu.archiveId,
        title: "Mark as read",
        icons: {
          16: "assets/icons/ionicons-checkmark.svg",
        },
      })
      browser.contextMenus.create({
        contexts: getAvaiableContexts(),
        id: ContextMenu.deleteId,
        title: "Delete",
        icons: {
          16: "assets/icons/ionicons-trash-b.svg",
        },
      })
    },

    destroyEntries: function () {
      Logger.log("(ContextMenu.destroyEntries) destroy all right-click entries")
      browser.contextMenus.removeAll()
    },

    setState: function (state) {
      switch (state) {
        case ContextMenu.pageAlreadyInPocket:
          return Promise.all([
            disable(ContextMenu.addId),
            enable(ContextMenu.archiveId),
            enable(ContextMenu.deleteId),
          ])
        case ContextMenu.pageNotInPocket:
        case ContextMenu.multipleTabSelection:
          return Promise.all([
            enable(ContextMenu.addId),
            disable(ContextMenu.archiveId),
            disable(ContextMenu.deleteId),
          ])
      }
    },
  }
})()

export default ContextMenu
