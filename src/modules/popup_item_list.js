"use strict"

import Items from "../modules/items.js"
import Logger from "../modules/logger.js"
import { defaultDisplaySetting } from "../modules/popup_ui.js"
import PopupPagination from "../modules/popup_pagination.js"
import PopupTagEdition from "../modules/popup_tag_edition.js"
import Settings from "../modules/settings.js"
import TextSelectionHandler from "../modules/text_selection_handler.js"
import Utility from "../modules/utility.js"
import { MouseButtons, concealedProtocols } from "../modules/constants.js"

// ----------------

const PopupItemList = (function () {
  const ITEMS_PER_BATCH = 200
  const CURRENT_ITEM_CLASS = "current-page"
  const placeholderNoResults = document.querySelector(".search-no-results")
  const placeholderNeverFetched = document.querySelector(".onboarding-never-fetched")
  const itemsContainer = document.querySelector(".list-component")
  const itemTemplate = document.querySelector("#item-template")
  const itemsBuilding = {
    itemsToCreate: undefined,
    createdItemsCount: undefined,
    startsAt: undefined,
  }

  function areAllItemsBuilt() {
    const isInitialized = itemsBuilding.itemsToCreate !== undefined && itemsBuilding.createdItemsCount !== undefined
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
  function openLink(item, openInNewTab = false) {
    browser.runtime.sendMessage({
      action: "read-item",
      item,
      openInNewTab: openInNewTab,
    })
  }

  function resetUI() {
    itemsContainer.textContent = ""
  }

  function buildItemElement(item, opts = { current: false }) {
    const clone = itemTemplate.content.cloneNode(true)

    const li = clone.querySelector("li")
    if (item.fav == 1) li.classList.add("favorite")
    if (opts.current) li.classList.add(CURRENT_ITEM_CLASS)
    li.dataset.id = item.id
    li.dataset.url = item.url
    li.dataset.fav = item.fav

    const title = li.getElementsByClassName("title")[0]
    title.textContent = formatTitle(item.title)

    const favicon = li.getElementsByClassName("favicon")[0]
    const tabIcon = li.getElementsByClassName("tab-icon")[0]
    if (opts.current) {
      favicon.style.display = "none"
      tabIcon.setAttribute("data", "../assets/images/tab-icon.svg")
    } else {
      tabIcon.style.display = "none"
      favicon.setAttribute("src", faviconUrl(item.url))
    }

    const url = li.getElementsByClassName("url")[0]
    url.textContent = formatUrl(item.url)

    if (item.tags && item.tags.length > 0) {
      const tagsElement = li.getElementsByClassName("tags")[0]
      for (const tag of item.tags) {
        const tagElement = document.createElement("span")
        tagElement.className = "tag"

        const tagIcon = document.createElement("i")
        tagIcon.classList.add("icon", "ion-md-pricetag")

        tagElement.appendChild(tagIcon)
        tagElement.appendChild(document.createTextNode(tag))

        tagsElement.appendChild(tagElement)
      }
    }

    return clone
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

  function keyupEventListener(ev) {
    if (Utility.matchesOrHasParent(ev.target, "input.title") || Utility.matchesOrHasParent(ev.target, ".submit-edit")) {
      if (ev.key === "Enter") {
        submitEdition(ev)
      }
    } else if (Utility.matchesOrHasParent(ev.target, "input.new-tag")) {
      switch (ev.key) {
        case "Enter":
          if (ev.target.value === "") {
            submitEdition(ev)
          } else {
            PopupTagEdition.appendTagToItem(ev)
          }
          break
        case "Backspace":
          if (ev.target.dataset.previousValue == "") {
            PopupTagEdition.deleteLastTag(ev)
          } else {
            ev.target.dataset.previousValue = ev.target.value
          }
          break
        case "ArrowLeft":
          if (ev.target.value === "") PopupTagEdition.focusPreviousTag(ev)
          break
        case "ArrowRight":
          if (ev.target.value === "") PopupTagEdition.focusNextTag(ev)
          break
        default:
          ev.target.dataset.previousValue = ev.target.value
          break
      }
    } else if (Utility.matchesOrHasParent(ev.target, "span.tag")) {
      switch (ev.key) {
        case "Backspace":
          PopupTagEdition.deleteFocusedTagAndFocusPreviousOne(ev)
          break
        case "ArrowLeft":
          PopupTagEdition.focusPreviousTag(ev)
          break
        case "ArrowRight":
          PopupTagEdition.focusNextTag(ev)
          break
      }
    } else if (Utility.matchesOrHasParent(ev.target, ".cancel-edit")) {
      if (ev.key === "Enter") {
        cancelEdition(ev)
      }
    }
  }

  function enterEdition(itemId, opts) {
    const initialItem = document.querySelector(`.item[data-id='${itemId}']`)
    Logger.log(`(PopupItemList.enterEdition) Existing title: ${initialItem.querySelector("span.title").textContent}`)

    const editionTemplate = document.querySelector("#item-edition-template")
    const clone = editionTemplate.content.cloneNode(true)
    const li = clone.querySelector("li")
    if (opts.current) li.classList.add(CURRENT_ITEM_CLASS)
    li.dataset.id = itemId

    const titleField = clone.querySelector("input.title")
    titleField.value = initialItem.querySelector("span.title").textContent

    setTimeout(() => {
      titleField.focus()
    }, 100)

    browser.storage.local.get("items", ({ items }) => {
      const itemsList = Utility.parseJson(items)

      const itemTags = Array.from(initialItem.querySelectorAll("span.tag")).map(tag => tag.textContent)
      const tagsContainer = clone.querySelector(".tags")
      const newTagField = clone.querySelector(".new-tag")
      for (const itemTag of itemTags) {
        const tagElement = document.createElement("span")
        tagElement.classList.add("tag")
        tagElement.setAttribute("tabIndex", -1)
        tagElement.textContent = itemTag

        tagsContainer.insertBefore(tagElement, newTagField)
      }

      // Tags datalist
      const allExistingTags = [...new Set(itemsList.flatMap(item => item.tags))]
      const tagsDatalist = clone.querySelector("#tags-datalist")
      for (const tag of allExistingTags.sort()) {
        const tagOption = document.createElement("option")
        tagOption.value = tag
        tagOption.textContent = tag

        tagsDatalist.appendChild(tagOption)
      }

      // Focused events on new-tag: must outline the outer div,
      // and not the new-tag input itself
      newTagField.addEventListener("focus", () => tagsContainer.classList.add("focused"))
      newTagField.addEventListener("blur", () => tagsContainer.classList.remove("focused"))

      initialItem.parentNode.replaceChild(clone, initialItem)
    })
  }

  function cancelEdition(ev) {
    const targetItemElement = Utility.getParent(ev.target, ".item")
    const targetItemId = targetItemElement.dataset.id
    browser.storage.local.get("items").then(({ items }) => {
      const matchingItem = Items.findById(items, targetItemId)
      Logger.log(`(PopupItemList.cancelEdition) Cancel editing item ${targetItemId}`)

      // Rebuild a li with the not edited item
      const restoredItem = buildItemElement(matchingItem, {
        current: targetItemElement.classList.contains(CURRENT_ITEM_CLASS),
      })

      // Replace the current "form" item with the new built item
      targetItemElement.parentNode.replaceChild(restoredItem, targetItemElement)
    })
  }

  function submitEdition(ev) {
    const targetItemElement = Utility.getParent(ev.target, ".item")
    const targetItemId = targetItemElement.dataset.id
    const editedTitle = targetItemElement.querySelector("input.title").value

    const editedTagElements = targetItemElement.querySelectorAll(".tags .tag")
    const editedTags = Array.from(editedTagElements).map(tag => tag.textContent.trim())
    const uniqueEditedTags = [...new Set(editedTags)]

    browser.storage.local.get("items").then(({ items }) => {
      const matchingItem = Items.findById(items, targetItemId)

      // Send message to background for actual item update + send to API, if items have actually been updated
      if (!Items.areSame(matchingItem, { title: editedTitle, tags: uniqueEditedTags })) {
        Logger.log(`(PopupItemList.submitEdition) Update item ${targetItemId}`)
        browser.runtime.sendMessage({
          action: "update-item",
          id: matchingItem.id,
          title: editedTitle,
          tags: uniqueEditedTags,
          previousTags: matchingItem.tags,
          url: matchingItem.url,
          created_at: matchingItem.created_at,
        })
      }

      // Rebuild a li with the edited item
      const updatedItem = buildItemElement(
        {
          ...matchingItem,
          title: editedTitle,
          tags: uniqueEditedTags,
        },
        { current: targetItemElement.classList.contains(CURRENT_ITEM_CLASS) },
      )

      // Replace the current "form" item with the new built item
      targetItemElement.parentNode.replaceChild(updatedItem, targetItemElement)
    })
  }

  // NOTE: there are several steps depending on the local storage data
  // -> No access_token = never authenticated
  // -> No last_retrieve = authenticated but never finished the initial items sync
  // TODO: maybe this should be moved to popup_ui instead?
  function togglePlaceholderVisibility(haveAllItemsBeenFetchedAlready, itemsCount) {
    if (!haveAllItemsBeenFetchedAlready) {
      placeholderNeverFetched.classList.remove("hidden")
      itemsContainer.classList.add("hidden")
      placeholderNoResults.classList.add("hidden")
    } else if (itemsCount > 0) {
      placeholderNeverFetched.classList.add("hidden")
      itemsContainer.classList.remove("hidden")
      placeholderNoResults.classList.add("hidden")
    } else {
      placeholderNeverFetched.classList.add("hidden")
      itemsContainer.classList.add("hidden")
      placeholderNoResults.classList.remove("hidden")
    }
  }

  function getCurrentPageItem(items, currentUrl) {
    const currentPageItem = (Utility.parseJson(items) || []).find(item => {
      return Items.matches(item, currentUrl)
    })

    return currentPageItem
  }

  function updateFavoriteStatus(items) {
    items.forEach(item => {
      const itemElement = document.querySelector(`.item[data-id='${item.id}']`)
      if (item.fav === "1") {
        itemElement.classList.add("favorite")
        itemElement.dataset.fav = "1"
      } else if (item.fav === "0") {
        itemElement.classList.remove("favorite")
        itemElement.dataset.fav = "0"
      }
    })
  }

  function toggleFavorite(itemId) {
    const item = document.querySelector(`.item[data-id='${itemId}']`)
    const isFaved = item.dataset.fav
    item.querySelector(".favorite-action .favorite").classList.add("hidden")
    item.querySelector(".favorite-action .loader").classList.remove("hidden")

    browser.runtime.sendMessage({
      action: isFaved === "1" ? "unfavorite" : "favorite",
      id: itemId,
    })
  }

  function markAsRead(itemId) {
    const item = document.querySelector(`.item[data-id='${itemId}']`)
    item.classList.add("removing")
    item.querySelector(".tick-action .tick").classList.add("hidden")
    item.querySelector(".tick-action .loader").classList.remove("hidden")

    browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
      browser.runtime.sendMessage({ action: "mark-as-read", id: itemId, tabId: currentTab.id })
    })
  }

  function deleteItem(itemId) {
    const item = document.querySelector(`.item[data-id='${itemId}']`)
    item.classList.add("removing")
    item.querySelector(".delete-action .trash").classList.add("hidden")
    item.querySelector(".delete-action .loader").classList.remove("hidden")

    browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
      browser.runtime.sendMessage({ action: "delete-item", id: itemId, tabId: currentTab.id })
    })
  }

  function getVisibleItemsIds() {
    const visibleItems = itemsContainer.querySelectorAll(`.item:not(.disappearing):not(.${CURRENT_ITEM_CLASS})`)
    return Array.from(visibleItems).map(item => item.dataset.id)
  }

  function updateCurrentItem(item) {
    Logger.log(`(PopupItemList.updateCurrentItem) ${item}`)
    const currentPageItemElement = itemsContainer.querySelector(`.${CURRENT_ITEM_CLASS}`)
    const newCurrentPageItemElement = buildCurrentItem(item)

    if (currentPageItemElement) {
      if (currentPageItemElement.dataset.id !== item.id) {
        itemsContainer.replaceChild(newCurrentPageItemElement, currentPageItemElement)
      }
    } else {
      itemsContainer.insertBefore(newCurrentPageItemElement, itemsContainer.firstChild)
    }
  }

  return {
    setupEventListeners: function () {
      document.addEventListener("keyup", keyupEventListener)

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

        const targetItemElement = Utility.getParent(ev.target, ".item")
        const targetItemId = targetItemElement.dataset.id
        const targetItem = { id: targetItemId, url: targetItemElement.dataset.url }

        if (Utility.matchesOrHasParent(ev.target, ".delete-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked delete for item ${targetItemId}`)
            deleteItem(targetItemId)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".tick-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked tick for item ${targetItemId}`)
            markAsRead(targetItemId)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".favorite-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Clicked favorite for item ${targetItemId}`)
            toggleFavorite(targetItemId)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".edit-action")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Edit item ${targetItemId}`)
            enterEdition(targetItemId, {
              current: targetItemElement.classList.contains(CURRENT_ITEM_CLASS),
            })
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".cancel-edit")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Cancel edition for item ${targetItemId}`)
            cancelEdition(ev)
          }
        } else if (Utility.matchesOrHasParent(ev.target, ".submit-edit")) {
          if (ev.button === MouseButtons.LEFT) {
            Logger.log(`(PopupItemList.eventListener) Submit edition for item ${targetItemId}`)
            submitEdition(ev)
          }
        } else if (ev.target.matches("span.title") || ev.target.matches("span.url")) {
          const openInNewTab = true
          switch (ev.button) {
            case MouseButtons.MIDDLE:
              Logger.log(`(PopupItemList.eventListener) Middle-click, force opening ${targetItemId} in new tab`)
              openLink(targetItem, openInNewTab)
              break
            case MouseButtons.LEFT:
              if (ev.ctrlKey || ev.metaKey) {
                Logger.log(
                  `(PopupItemList.eventListener) left-click + ctrlKey:${ev.ctrlKey}/metaKey:${ev.metaKey}, force opening ${targetItemId} in new tab`,
                )
                openLink(targetItem, openInNewTab)
              } else {
                Logger.log(
                  `(PopupItemList.eventListener) left-click, open ${targetItemId} based on openInNewTab setting`,
                )
                openLink(targetItem)
              }
              break
          }
        }
      })
    },

    scrollToTop: function () {
      if (itemsContainer.scrollTop > 0) {
        setTimeout(() => {
          itemsContainer.scrollTo(0, 0)
        }, 50)
      }
    },

    buildAllItems: function (items, currentItem) {
      Logger.log("(PopupItemList.buildAllItems)")

      // Reset list component content
      resetUI()

      // Prepare dom building
      itemsBuilding.itemsToCreate = items
      itemsBuilding.createdItemsCount = 0

      // Build and append current item
      if (currentItem) updateCurrentItem(currentItem)

      // Build the rest of the items list
      Logger.log("(PopupItemList.buildAllItems) Request a 1st animation frame for buildBatch method")
      requestAnimationFrame(buildBatch)
    },

    // TODO: extract more of the pagination logic from here
    // TODO: add some logging for paging and so forth
    // TODO: reduce duplication with updateList !?
    drawList: function (opts = {}) {
      Settings.init()
        .then(function () {
          return Settings.get("perPage")
        })
        .then(function (perPage) {
          browser.storage.local
            .get(["items", "display", "last_retrieve"])
            .then(async ({ items, display, last_retrieve }) => {
              const parsedDisplay = Utility.parseJson(display) || defaultDisplaySetting
              // NOTE: empty query "" must be used and should not fall back to parsedDisplay value
              const query = opts.query != null ? opts.query : parsedDisplay.query
              const pageToDisplay = opts.page || parsedDisplay.currentPage
              const [currentTab] = await browser.tabs.query({ currentWindow: true, active: true })
              Logger.log(`(PopupItemList.drawList) Start filtering item`)

              // Parse and filter the item list
              const currentPageItem = await getCurrentPageItem(items, currentTab.url)
              const filteredItems = Items.filter(items, query, currentTab.url)
              const itemsToRender = Items.paginate(filteredItems, pageToDisplay, perPage)

              // Display the "no results" message or hide it
              togglePlaceholderVisibility(!!last_retrieve, itemsToRender.length + (currentPageItem ? 1 : 0))

              // Rebuild all items
              PopupItemList.buildAllItems(itemsToRender, currentPageItem)

              // Record currentPage and query, in case they've been "forced" through the opts param
              // `displayedAt` value must remain the same (that's why we assign `parsedDisplay`)
              const actualDisplay = { currentPage: pageToDisplay, query: query }
              const displayOptions = Object.assign({}, parsedDisplay, actualDisplay)
              browser.storage.local.set({ display: JSON.stringify(displayOptions) })

              // Updates the PopupUI: page selector with the current page options
              PopupPagination.updatePaginationUI(pageToDisplay, perPage, filteredItems.length)
            })
        })

      return
    },

    // TODO: extract more of the pagination logic from here
    // TODO: add some logging for paging and so forth
    // TODO: reduce duplication with drawList !?
    updateList: function (opts = {}) {
      Logger.log("PopupItemList.updateList")
      Settings.init()
        .then(function () {
          return Settings.get("perPage")
        })
        .then(function (perPage) {
          browser.storage.local
            .get(["items", "display", "last_retrieve"])
            .then(async ({ items, display, last_retrieve }) => {
              const parsedDisplay = Utility.parseJson(display) || defaultDisplaySetting
              // NOTE: empty query "" must be used and should not fall back to parsedDisplay value
              const query = opts.query != null ? opts.query : parsedDisplay.query
              const pageToDisplay = opts.page || parsedDisplay.currentPage
              const [currentTab] = await browser.tabs.query({ currentWindow: true, active: true })

              // Parse and filter the item list
              const currentPageItem = await getCurrentPageItem(items, currentTab.url)
              const filteredItems = Items.filter(items, query, currentTab.url)
              const itemsToRender = Items.paginate(filteredItems, pageToDisplay, perPage)
              const itemsToRenderIds = itemsToRender.map(item => item.id)

              // Display the "no results" message or hide it
              togglePlaceholderVisibility(!!last_retrieve, itemsToRender.length + (currentPageItem ? 1 : 0))

              // Rebuild all items
              const visibleItemsIds = getVisibleItemsIds()
              const itemIdsToKeep = visibleItemsIds.filter(id => itemsToRenderIds.includes(id))
              const itemIdsToHide = visibleItemsIds.filter(id => !itemsToRenderIds.includes(id))

              if (currentPageItem) {
                // if there is a currentPageItem then we need to build or update it
                updateCurrentItem(currentPageItem)
              } else {
                // if no currentPageItem && the current page item is still displayed,
                // then we get its id and add it to the list of items to delete
                const currentPageItemElement = itemsContainer.querySelector(`.${CURRENT_ITEM_CLASS}`)
                if (currentPageItemElement) {
                  itemIdsToHide.push(currentPageItemElement.dataset.id)
                }
              }

              // First step: all removed items still visible must disappear
              PopupItemList.fadeOutItem(...itemIdsToHide)

              // Second step: prepare the insertion of all missing items
              // Generate a table of all predecessors, to use insertBefore/appendChild to build the DOM
              const predecessorTable = {}
              let nextVisibleItemId = itemIdsToKeep.shift()

              for (const itemToRender of itemsToRender) {
                if (itemToRender.id != nextVisibleItemId) {
                  if (predecessorTable[nextVisibleItemId]) predecessorTable[nextVisibleItemId].push(itemToRender)
                  else predecessorTable[nextVisibleItemId] = [itemToRender]
                } else {
                  nextVisibleItemId = itemIdsToKeep.shift() || "last"
                }
              }

              // Use the predecessor table to inject the new items at the proper place in the list
              for (const key in predecessorTable) {
                const itemsToInject = predecessorTable[key]
                if (key != "last") {
                  // When key is an ID, we insert before the node having this ID
                  PopupItemList.insertItems(itemsToInject, key)
                } else {
                  // When key is 'last', we append the dom at the end of the list
                  PopupItemList.appendItems(itemsToInject)
                }
              }

              // Last step: update faved/unfaved items
              updateFavoriteStatus(itemsToRender)

              // Record currentPage and query, in case they've been "forced" through the opts param
              // `displayedAt` value must remain the same (that's why we assign `parsedDisplay`)
              const actualDisplay = { currentPage: pageToDisplay, query: query }
              const displayOptions = Object.assign({}, parsedDisplay, actualDisplay)
              browser.storage.local.set({ display: JSON.stringify(displayOptions) })

              // Updates the PopupUI: page selector with the current page options
              PopupPagination.updatePaginationUI(pageToDisplay, perPage, filteredItems.length)
            })
        })

      return
    },

    // Will build DOM for items and insert it before the item whose id=beforeItemId
    insertItems: async function (items, beforeItemId) {
      const beforeNode = document.querySelector(`.item:not(.disappearing)[data-id='${beforeItemId}']`)
      Logger.log(`(PopupItemList.insertItems) Insert ${items.length} items before item ${beforeItemId}`)
      Logger.log(`(PopupItemList.insertItems) Insert before ${beforeNode}`)
      const domToInsert = buildDomFragment(items)
      itemsContainer.insertBefore(domToInsert, beforeNode)
    },

    // Will build DOM for items and insert it at the end of the list container
    appendItems: async function (items) {
      Logger.log(`(PopupItemList.appendItems) Append ${items.length} items`)
      const domToAppend = buildDomFragment(items)
      itemsContainer.appendChild(domToAppend)
    },

    fadeOutItem: (...itemIds) => {
      itemIds.forEach(itemId => {
        Logger.log(`(PopupItemList.fadeOutItem) Will make ${itemId} item disappear from the list`)
        document.querySelector(`.item[data-id='${itemId}']`).classList.add("disappearing")
      })
    },

    favoriteItem: itemId => {
      const item = document.querySelector(`.item[data-id='${itemId}']`)
      item.querySelector(".favorite-action .favorite").classList.remove("hidden")
      item.querySelector(".favorite-action .loader").classList.add("hidden")
      item.classList.add("favorite")
      item.dataset.fav = "1"
    },

    unfavoriteItem: itemId => {
      const item = document.querySelector(`.item[data-id='${itemId}']`)
      item.querySelector(".favorite-action .favorite").classList.remove("hidden")
      item.querySelector(".favorite-action .loader").classList.add("hidden")
      item.classList.remove("favorite")
      item.dataset.fav = "0"
    },
  }
})()

export default PopupItemList
