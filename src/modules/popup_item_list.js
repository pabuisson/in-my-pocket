"use strict"

import FeatureSwitches from "./feature_switches.js"
import Logger from "../modules/logger.js"
import PopupUI from "../modules/popup_ui.js"
import TextSelectionHandler from "../modules/text_selection_handler.js"
import Utility from "../modules/utility.js"
import { MouseButtons, concealedProtocols } from "../modules/constants.js"

// ----------------

const PopupItemList = (function () {
  const ITEMS_PER_BATCH = 200
  const CURRENT_ITEM_CLASS = "current-page"
  const itemsContainer = document.querySelector(".list-component")
  const itemTemplate = document.querySelector("#item-template")
  const itemsBuilding = {
    itemsToCreate: undefined,
    createdItemsCount: undefined,
    startsAt: undefined,
  }

  function areAllItemsBuilt() {
    const isInitialized =
      itemsBuilding.itemsToCreate !== undefined && itemsBuilding.createdItemsCount !== undefined
    const areAllItemsBuilt = itemsBuilding.createdItemsCount === itemsBuilding.itemsToCreate.length

    return isInitialized && areAllItemsBuilt
  }

  function getBuildDuration() {
    return new Date() - itemsBuilding.startsAt
  }

  function faviconUrl(url) {
    return `https://external-content.duckduckgo.com/ip3/${Utility.domain(url)}.ico`
  }

  function formatUrl(url) {
    const protocolsToRemove = concealedProtocols.join("|")
    const removalRegex = new RegExp(`^(${protocolsToRemove})://(www.)?`, "gi")

    return url.replace(removalRegex, "")
  }

  function formatTitle(title) {
    return title || " — "
  }

  // openInNewTab param allows us to force the behaviour (ctrl-click or middle-click)
  function openLink(itemId, openInNewTab = false) {
    browser.runtime.sendMessage({
      action: "read-item",
      itemId: itemId,
      openInNewTab: openInNewTab,
    })
  }

  function resetUI() {
    itemsContainer.innerHTML = ""
  }

  function buildFavoriteAction() {
    const favoriteAction = document.createElement("div")
    const favoriteElement = document.createElement("div")
    const favoriteIconFont = document.createElement("i")
    const favoriteLoadElement = document.createElement("div")
    favoriteAction.className = "favorite-action"
    favoriteIconFont.classList.add("icon", "ion-md-star")
    favoriteElement.className = "favorite"
    favoriteLoadElement.classList.add("loader", "hidden")
    favoriteElement.appendChild(favoriteIconFont)
    favoriteAction.appendChild(favoriteElement)
    favoriteAction.appendChild(favoriteLoadElement)

    return favoriteAction
  }

  function buildTickAction() {
    const tickAction = document.createElement("div")
    const tickElement = document.createElement("div")
    const tickIconFont = document.createElement("i")
    const tickLoadElement = document.createElement("div")
    tickAction.className = "tick-action"
    tickIconFont.classList.add("icon", "ion-md-checkmark")
    tickElement.className = "tick"
    tickLoadElement.classList.add("loader", "hidden")
    tickElement.appendChild(tickIconFont)
    tickAction.appendChild(tickElement)
    tickAction.appendChild(tickLoadElement)

    return tickAction
  }

  function buildDeleteAction() {
    const deleteAction = document.createElement("div")
    const trashElement = document.createElement("div")
    const trashIconFont = document.createElement("i")
    const trashLoadElement = document.createElement("div")
    deleteAction.className = "delete-action"
    trashIconFont.classList.add("icon", "ion-md-trash")
    trashElement.className = "trash"
    trashLoadElement.classList.add("loader", "hidden")
    trashElement.appendChild(trashIconFont)
    deleteAction.appendChild(trashElement)
    deleteAction.appendChild(trashLoadElement)

    return deleteAction
  }

  function buildActionsContainer() {
    const actionContainer = document.createElement("div")
    actionContainer.className = "actions-container"

    actionContainer.appendChild(buildTickAction())
    actionContainer.appendChild(buildFavoriteAction())
    actionContainer.appendChild(buildDeleteAction())

    return actionContainer
  }

  function buildItemElementWithHtmlTemplate(item, opts) {
    const clone = itemTemplate.content.cloneNode(true)

    const li = clone.querySelector("li")
    if (item.fav == 1) li.classList.add("favorite")
    if (opts.current) li.classList.add(CURRENT_ITEM_CLASS)
    li.dataset.id = item.id
    li.dataset.fav = item.fav

    const title = li.getElementsByClassName("title")[0]
    title.textContent = formatTitle(item.title)

    const favicon = li.getElementsByClassName("favicon")[0]
    favicon.setAttribute("src", faviconUrl(item.url))

    const url = li.getElementsByClassName("url")[0]
    url.textContent = formatUrl(item.url)

    if (FeatureSwitches.TAGS_ENABLED && item.tags && item.tags.length > 0) {
      const tagsElement = li.getElementsByClassName("tags")[0]
      for (const tag of item.tags) {
        const tagElement = document.createElement("span")
        tagElement.className = "tag"
        tagElement.textContent = tag

        tagsElement.appendChild(tagElement)
      }
    }

    return clone
  }

  function buildItemElementWithJavascript(item, opts) {
    const liElement = document.createElement("li")
    const faviconElement = document.createElement("img")
    const titleContent = document.createElement("span")
    const urlContent = document.createElement("span")
    const tagsContent = document.createElement("span")
    const urlAndTagsContent = document.createElement("span")

    liElement.className = "item"
    if (item.fav == 1) liElement.classList.add("favorite")
    if (opts.current) liElement.classList.add(CURRENT_ITEM_CLASS)

    faviconElement.className = "favicon"
    titleContent.className = "title"
    urlContent.className = "url"
    tagsContent.className = "tags"
    urlAndTagsContent.className = "url-and-tags"

    faviconElement.setAttribute("src", faviconUrl(item.url))

    titleContent.appendChild(faviconElement)
    titleContent.appendChild(document.createTextNode(formatTitle(item.title)))

    urlContent.appendChild(document.createTextNode(formatUrl(item.url)))
    urlAndTagsContent.appendChild(urlContent)

    if (FeatureSwitches.TAGS_ENABLED && item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        const tagElement = document.createElement("span")
        tagElement.className = "tag"
        tagElement.textContent = tag
        tagsContent.appendChild(tagElement)
      }
      urlAndTagsContent.appendChild(tagsContent)
    }

    liElement.appendChild(buildActionsContainer())
    liElement.appendChild(titleContent)
    liElement.appendChild(urlAndTagsContent)

    liElement.dataset.id = item.id
    liElement.dataset.fav = item.fav

    return liElement
  }

  function buildItemElement(item, opts = { current: false }) {
    if (FeatureSwitches.HTML_TEMPLATES) {
      return buildItemElementWithHtmlTemplate(item, opts)
    } else {
      return buildItemElementWithJavascript(item, opts)
    }
  }

  function buildDomFragment(items) {
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < items.length; i++) {
      const newDomElement = buildItemElement(items[i])
      fragment.appendChild(newDomElement)
    }

    return fragment
  }

  function buildCurrentItem(currentItem) {
    Logger.log(`(buildCurrentItem) adding current item at the top of the list / ${currentItem.url}`)
    return buildItemElement(currentItem, { current: true })
  }

  async function buildBatch() {
    Logger.log(`(PopupItemList.buildBatch) build a new batch of ${ITEMS_PER_BATCH} items`)
    if (itemsBuilding.createdItemsCount === 0) {
      itemsBuilding.startsAt = new Date()
    }

    for (let i = 0; i < ITEMS_PER_BATCH; i++) {
      if (areAllItemsBuilt() == true) break

      const itemToBuild = itemsBuilding.itemsToCreate[itemsBuilding.createdItemsCount]
      itemsContainer.appendChild(buildItemElement(itemToBuild))
      itemsBuilding.createdItemsCount++
    }

    // if DOM is not all built yet, then ask for another animation frame where
    // we can keep on building the DOM
    if (areAllItemsBuilt() == false) {
      Logger.log("Will request an animation frame for another run of the buildBatch method")
      requestAnimationFrame(buildBatch)
    } else {
      Logger.log(`All items have been built in ${getBuildDuration()}ms`)
      itemsBuilding.startsAt = undefined
    }
  }

  return {
    setupEventListeners: function () {
      itemsContainer.addEventListener("mouseup", function (ev) {
        if (!ev.target) return
        if (ev.detail > 1) return

        ev.preventDefault()

        // Don't proceed with click handling if we're changing the selection
        // selectstart event can't be used, has he behaves differently in Chrome and Firefox
        // In Firefox: click does not trigger selectstart
        // In Chrome: click does trigger selectstart
        if (TextSelectionHandler.hasChanged(window.getSelection().toString())) {
          TextSelectionHandler.storeSelection(window.getSelection().toString())
          return
        }

        const targetItem = Utility.getParent(ev.target, ".item")
        const targetItemId = targetItem.dataset.id

        if (Utility.matchesOrHasParent(ev.target, ".delete-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked delete for item ${targetItemId}`)
            PopupUI.deleteItem(targetItemId)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".tick-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked tick for item ${targetItemId}`)
            PopupUI.markAsRead(targetItemId)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".favorite-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked favorite for item ${targetItemId}`)
            PopupUI.toggleFavorite(targetItemId)
          }
        } else if (ev.target.matches(".title") || ev.target.matches(".url")) {
          const openInNewTab = true
          switch (ev.button) {
            case MouseButtons.MIDDLE:
              Logger.log(
                `(PopupItemList.eventListener) Middle-click, force opening ${targetItemId} in new tab`
              )
              openLink(targetItemId, openInNewTab)
              break
            case MouseButtons.LEFT:
              if (ev.ctrlKey || ev.metaKey) {
                Logger.log(
                  `(PopupItemList.eventListener) left-click + ctrlKey:${ev.ctrlKey}/metaKey:${ev.metaKey}, force opening ${targetItemId} in new tab`
                )
                openLink(targetItemId, openInNewTab)
              } else {
                Logger.log(
                  `(PopupItemList.eventListener) left-click, open ${targetItemId} based on openInNewTab setting`
                )
                openLink(targetItemId)
              }
              break
          }
        }
      })
    },

    buildAll: function (items, currentItem) {
      Logger.log("(PopupItemList.buildAll)")

      // Remove previous "requestAnimationFrame" registered in case
      if (!FeatureSwitches.HTML_TEMPLATES) cancelAnimationFrame(buildBatch)

      // Reset list component content
      resetUI()

      // Prepare dom building
      itemsBuilding.itemsToCreate = items
      itemsBuilding.createdItemsCount = 0

      // Build and append current item
      if (currentItem) PopupItemList.updateCurrentItem(currentItem)

      // Build the rest of the items list
      Logger.log("(PopupItemList.buildAll) Request a 1st animation frame for buildBatch method")
      requestAnimationFrame(buildBatch)
    },

    // Will build DOM for items and insert it before the item whose id=beforeItemId
    insertItems: async function (items, beforeItemId) {
      const beforeNode = document.querySelector(
        `.item:not(.disappearing)[data-id='${beforeItemId}']`
      )
      Logger.log(
        `(PopupItemList.insertItems) Insert ${items.length} items before item ${beforeItemId}`
      )
      Logger.log(`(PopupItemList.insertItems) Insert before ${beforeNode}`)
      const domToInsert = buildDomFragment(items)
      itemsContainer.insertBefore(domToInsert, beforeNode)
    },

    // Will build DOM for items and insert it at the end of the list container
    appendItems: async function (items) {
      const domToAppend = buildDomFragment(items)
      itemsContainer.appendChild(domToAppend)
    },

    getVisibleItemsIds: function () {
      const visibleItems = itemsContainer.querySelectorAll(
        `.item:not(.disappearing):not(.${CURRENT_ITEM_CLASS})`
      )

      return Array.from(visibleItems).map(item => item.dataset.id)
    },

    updateCurrentItem: function (item) {
      const currentPageItemElement = itemsContainer.querySelector(`.${CURRENT_ITEM_CLASS}`)
      const newCurrentPageItemElement = buildCurrentItem(item)

      if (currentPageItemElement) {
        // NOTE: any real life occurrence of this?
        itemsContainer.replaceChild(newCurrentPageItemElement, currentPageItemElement)
      } else {
        itemsContainer.insertBefore(newCurrentPageItemElement, itemsContainer.firstChild)
      }
    },
  }
})()

export default PopupItemList
