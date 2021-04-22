"use strict"

import FeatureSwitches from "./feature_switches.js"
import Logger from "../modules/logger.js"
import PopupUI from "../modules/popup_ui.js"
import TextSelectionHandler from "../modules/text_selection_handler.js"
import Utility from "../modules/utility.js"
import { MouseButtons, concealedProtocols } from "../modules/constants.js"

// ----------------

const PopupItemList = (function () {
  const ITEMS_PER_BATCH = 50
  let itemsToCreate = undefined
  let totalItemsCount = undefined
  let createdItemsCount = undefined
  const itemsContainer = document.querySelector(".list-component")

  function areAllItemsBuilt() {
    const isInitialized = totalItemsCount !== undefined && createdItemsCount !== undefined
    const areAllItemsBuilt = createdItemsCount === totalItemsCount

    return isInitialized && areAllItemsBuilt
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

  async function buildItemElement(item) {
    const liElement = document.createElement("li")
    const faviconElement = document.createElement("img")
    const titleContent = document.createElement("span")
    const urlContent = document.createElement("span")
    const tagsContent = document.createElement("span")
    const urlAndTagsContent = document.createElement("span")
    const [currentTab] = await browser.tabs.query({ currentWindow: true, active: true })

    liElement.className = "item"
    if (item.fav == 1) {
      liElement.classList.add("favorite")
    }
    if (currentTab.url === item.url) {
      liElement.classList.add("current-page")
    }

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
        tagElement.appendChild(document.createTextNode(tag))
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

  async function buildDomFragment(items) {
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < items.length; i++) {
      const newDomElement = await buildItemElement(items[i])
      fragment.appendChild(newDomElement)
    }

    return fragment
  }

  async function buildBatch() {
    Logger.log(`(PopupItemList.buildBatch) build a new batch of ${ITEMS_PER_BATCH} items`)

    for (let i = 0; i < ITEMS_PER_BATCH; i++) {
      // If we've already built all items then get out of this loop
      if (areAllItemsBuilt() == true) {
        Logger.log("All items are built -> break out of this loop, now!")
        break
      }

      const itemToCreate = itemsToCreate[createdItemsCount]
      itemsContainer.appendChild(await buildItemElement(itemToCreate))

      createdItemsCount++
    }

    // if DOM is not all built yet, then ask for another animation frame where
    // we can keep on building the DOM
    if (areAllItemsBuilt() == false) {
      Logger.log("Will request an animation frame for another run of the buildBatch method")
      requestAnimationFrame(buildBatch)
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

    buildAll: function (items) {
      Logger.log("(PopupItemList.buildAll)")

      // Remove previous "requestAnimationFrame" registered in case
      cancelAnimationFrame(buildBatch)

      // Reset list component content
      resetUI()

      // Prepare dom building
      itemsToCreate = items
      totalItemsCount = items.length
      createdItemsCount = 0

      // Build the dom
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
      const domToInsert = await buildDomFragment(items)
      itemsContainer.insertBefore(domToInsert, beforeNode)
    },

    // Will build DOM for items and insert it at the end of the list container
    appendItems: async function (items) {
      const domToAppend = await buildDomFragment(items)
      itemsContainer.appendChild(domToAppend)
    },

    getVisibleItemsIds: function () {
      const visibleItems = itemsContainer.querySelectorAll(".item:not(.disappearing)")
      const visibleItemsIds = []

      Logger.log(`(PopupItemList.getVisibleItems) ${visibleItems.length} visible items`)

      for (let i = 0; i < visibleItems.length; i++) {
        visibleItemsIds.push(visibleItems[i].dataset.id)
      }

      return visibleItemsIds
    },
  }
})()

export default PopupItemList
