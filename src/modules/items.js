"use strict"

import Badge from "./badge.js"
import BugReporter from "./bug_reporter.js"
import Logger from "./logger.js"
import PageAction from "./page_action.js"
import PocketApiRequester from "./pocket_api_requester.js"
import Settings from "./settings.js"
import Utility from "./utility.js"
import { PocketNotice, concealedProtocols } from "./constants.js"

// ---------------

const Items = (function () {
  let currentChecksum = null
  let parsedItems = null

  function parseItems(rawItems) {
    const rawItemsChecksum = rawItems ? Utility.hashCode(rawItems) : 0
    Logger.log(`(Items.parseItems) checksum: "${currentChecksum}"; new: "${rawItemsChecksum}"`)

    if (rawItemsChecksum != currentChecksum) {
      Logger.log("(Items.parsedItems) checksum changed, parse the items")

      currentChecksum = rawItemsChecksum
      parsedItems = Utility.parseJson(rawItems)
    }

    return parsedItems || []
  }

  // Query must be something like "a string" or "a string is:faved" or "a string is:unfaved"
  function matchQuery(item, query) {
    const lowerQuery = query.toLowerCase()

    const isFavedCriteria = lowerQuery.includes("is:faved")
    const isUnfavedCriteria = lowerQuery.includes("is:unfaved")

    const isTaggedCriteria = lowerQuery.includes("is:tagged")
    const isUntaggedCriteria = lowerQuery.includes("is:untagged")

    const keywordsToStripRegexp = /is:(faved|unfaved|tagged|untagged)/g
    const textCriteria = lowerQuery.replace(keywordsToStripRegexp, "").trim()

    return (
      matchFavedUnfaved(item, isFavedCriteria, isUnfavedCriteria) &&
      matchTaggedUntagged(item, isTaggedCriteria, isUntaggedCriteria) &&
      matchText(item, textCriteria)
    )
  }

  function matchText(item, textToMatch) {
    if (textToMatch === "") return true

    const protocolsToRemove = concealedProtocols.join("|")
    // TODO: create the Regex only once, it never changes
    const protocolsRemovalRegex = new RegExp(`^(${protocolsToRemove})://(www.)?`, "gi")

    const lowerUrl = (item.url.replace(protocolsRemovalRegex, "") || "").toLowerCase()
    const lowerTitle = (item.title || "").toLowerCase()

    const tags = item.tags ? item.tags.map(tag => tag.toLowerCase()) : []

    return (
      lowerTitle.includes(textToMatch) || lowerUrl.includes(textToMatch) || tags.find(tag => tag.includes(textToMatch))
    )
  }

  function matchFavedUnfaved(item, keepFaved, keepUnfaved) {
    if (keepFaved) {
      return item.fav === "1"
    } else if (keepUnfaved) {
      return item.fav === "0" || !item.fav
    }

    // No faved/unfaved criteria, should not filter the item out
    return true
  }

  function matchTaggedUntagged(item, keepTagged, keepUntagged) {
    if (keepTagged) {
      return item.tags && item.tags.length > 0
    } else if (keepUntagged) {
      return !item.tags || item.tags.length === 0
    }

    // No tagged/untagged criteria, should not filter the item out
    return true
  }

  // TODO: 'method' param should not be a magical string. Define fixed values in a module
  // method: archive|delete
  function removeItem(itemId, method, tabId) {
    Logger.log("(Items.removeItem) id to remove: " + itemId)
    Badge.startLoadingSpinner()

    browser.storage.local.get(["access_token", "items"]).then(({ access_token, items }) => {
      const apiRequester = new PocketApiRequester(access_token)
      const removalPromise = method == "archive" ? apiRequester.archive(itemId) : apiRequester.delete(itemId)

      removalPromise
        .then(response => {
          const parsedItems = Utility.parseJson(items) || []
          const removedItemIdx = parsedItems.findIndex(item => item.id === itemId)
          const removedItem = parsedItems[removedItemIdx]

          if (removedItemIdx >= 0) {
            Logger.log(`(Items.removeItem) item ${itemId} has been found and removed`)

            // Remove the archived item from the list and save list in storage
            parsedItems.splice(removedItemIdx, 1)
            browser.storage.local.set({ items: JSON.stringify(parsedItems) })

            // Send a message back to the UI
            const callbackAction = method == "archive" ? "marked-as-read" : "deleted"
            browser.runtime
              .sendMessage({ action: callbackAction, id: itemId })
              .catch(error => Logger.warn(`'action: ${callbackAction}' message could not be delivered: ${error}`))

            // Display an indicator on the badge that everything went well and update badge count
            Badge.flashSuccess().then(() => {
              if (tabId) {
                browser.tabs.get(tabId).then(currentTab => {
                  const urlsToCheck = Utility.getPossibleUrls(removedItem).filter(url => typeof url === "string")
                  if (urlsToCheck.includes(currentTab.url)) {
                    closeTabsIfNeeded(currentTab.id)
                  }
                })
              }

              // Disable page actions for removed items
              Logger.log("(Items.removeItem) item removed, update matching pageActions")

              const urlsToCheck = Utility.getPossibleUrls(removedItem).filter(url => typeof url === "string")
              browser.tabs.query({ url: urlsToCheck }).then(tabs => {
                const tabIds = tabs.map(tab => tab.id)
                PageAction.drawDisabled(...tabIds)
              })
            })
          } else {
            // NOTE: in that case, badge state must be restored and spinner should stop
            Logger.warn(`(Items.removeItem) item ${itemId} could not be found!`)
            Badge.updateCount()
          }
        })
        .catch(error => {
          BugReporter.captureException(error)
          Logger.error(`(Items.removeItem) Error while removing item: ${error}`)
          Badge.flashError()
        })
    })
  }

  function setFavorite(itemId, action) {
    Logger.log(`(Items.setFavorite) action='${action}'`)

    browser.storage.local.get(["access_token", "items"]).then(({ access_token, items }) => {
      Badge.startLoadingSpinner()
      const requester = new PocketApiRequester(access_token)
      const request = action === "favorite" ? requester.favorite(itemId) : requester.unfavorite(itemId)

      request
        .then(response => {
          const parsedItems = Utility.parseJson(items) || []

          // Update item in parsedItems
          const updatedItem = parsedItems.find(item => item.id == itemId)
          updatedItem.fav = action === "favorite" ? "1" : "0"

          // Save item list in storage and update badge count
          browser.storage.local.set({ items: JSON.stringify(parsedItems) })

          // Send a message back to the UI: favorited/unfavorited
          const actionOver = `${action}d`
          browser.runtime
            .sendMessage({ action: actionOver, id: itemId })
            .catch(error => Logger.warn(`'action: ${actionOver}' message could not be delivered: ${error}`))

          // Display an indicator on the badge that everything went well
          Badge.flashSuccess()
        })
        .catch(error => {
          BugReporter.captureException(error)
          Logger.error(`(Items.setFavorite) Error for action ${action} : ${error}`)
          Badge.flashError()
        })
    })
  }

  // NOTE: may be better placed somewhere else, let's keep it here for now for convenience
  function reportUnexpectedAddItemResponse(numberOfItemsToAdd, addResponse, addedItemsFromPocket) {
    if (numberOfItemsToAdd != addedItemsFromPocket.length) {
      const payloadKeysAndTypes = Object.keys(addResponse).map(key => {
        const value = addResponse[key]
        const valueType = Utility.getType(value)

        return `${key}: ${valueType}`
      })

      const details = {
        action: numberOfItemsToAdd === 1 ? "add" : "addBatch",
        itemsToAdd: numberOfItemsToAdd,
        addedItems: addedItemsFromPocket.length,
        nonNullAddedItems: addedItemsFromPocket.filter(Boolean).length,
        responseStatus: addResponse.status,
        responseKeys: payloadKeysAndTypes,
      }

      BugReporter.captureException(new Error("addItem: 200 response but unexpected number of items"), details)
    }
  }

  // add: Pocket should return an object, with a 'item' attribute holding the actual item
  // NOTE: however since July 2024, *some* users have started receiving the object attributes at the
  //       top level, instead of inside an 'item' attribute, which made all new item creation fail
  // addBatch: Pocket should return all objects in a 'action_results' attributes
  function getItemFromAddEndpointResponse(numberOfItemsToAdd, addResponse) {
    if (numberOfItemsToAdd === 1) {
      if (addResponse.item) {
        return [addResponse.item]
      } else {
        return [addResponse]
      }
    } else {
      return addResponse.action_results
    }
  }

  // rawObjectsToAdd = objects passed to addItem to be added to Pocket
  // they're all of the following form: { url:, title:, tabId: }
  function enrichItemsFromApi(itemsFromPocketAPI, rawObjectsToAdd) {
    return itemsFromPocketAPI.map(itemFromPocketApi => {
      if (!itemFromPocketApi.title) {
        const matchingRawObject = rawObjectsToAdd.find(rawObject => itemFromPocketApi.given_url == rawObject.url)
        itemFromPocketApi.title = matchingRawObject ? matchingRawObject.title : "—"
      }

      return itemFromPocketApi
    })
  }

  // tabIds: integer or array of integer The ids of the tab or tabs to close.
  function closeTabsIfNeeded(tabIds) {
    Settings.init().then(() => {
      const closeTabWhenRead = Settings.get("closeTabWhenRead")
      Logger.log(`(Items.closeTabsIfNeeded) Setting value: '${closeTabWhenRead}'`)

      if (closeTabWhenRead) {
        setTimeout(() => {
          browser.tabs
            .remove(tabIds)
            .then(() => {
              Logger.log(`(Items.closeTabsIfNeeded) succesfully closed the tabs ${tabIds}`)
            })
            .catch(error => {
              // NOTE: the tabs removal will raise an exception AS SOON AS ONE TABID can't be closed
              Logger.warn(`(Items.closeTabsIfNeeded) could not close all the tabs ${tabIds}`)
              Logger.warn(`(Items.closeTabsIfNeeded) Erorr: ${error}`)
              BugReporter.captureException(error)
            })
        }, 100)
      }
    })
  }

  // Format items that have just been ADDED via the API, via the "add/send" endpoints.
  // These items may or may not be already parsed and enriched by Pocket. If they've not been enriched,
  // they have very little information available: given_url, item_id, normal_url and title. All the
  // other attributes are null. The time_added/time_updated attributes are not even present.
  function formatPotentiallyNotParsedPocketItemForStorage(itemFromApi) {
    return {
      id: itemFromApi.item_id,
      title: itemFromApi.title,
      url: itemFromApi.given_url,
      created_at: (Date.now() / 1000) | 0,
    }
  }

  return {
    // Format items that have been FETCHED from the API via the "get" endpoint.
    // Items coming from the add/send endpoints don't necessarily have the same attributes
    // NOTE: how come I do not store the item_id?!
    formatFetchedPocketItemForStorage: function (itemFromApi) {
      return {
        id: itemFromApi.item_id,
        // given_title - The title that was saved along with the item.
        // resolved_title - The title that Pocket found for the item when it was parsed
        title: itemFromApi.given_title || itemFromApi.resolved_title,
        // given_url - The actual url that was saved with the item. This url should be used if the user wants to view the item.
        // resolved_url - The final url of the item. For example if the item was a shortened bit.ly link, this will be the actual article the url linked to.
        url: itemFromApi.given_url || itemFromApi.resolved_url,
        fav: itemFromApi.favorite,
        created_at: itemFromApi.time_added,
        updated_at: itemFromApi.time_updated,
        tags: Object.keys(itemFromApi.tags || {}),
      }
    },

    formatPocketItemForDebug: function (itemFromApi) {
      return {
        id: itemFromApi.item_id,
        status: itemFromApi.status,
        favorite: itemFromApi.favorite,
        timeAdded: itemFromApi.time_added,
        timeUpdated: itemFromApi.time_updated,
        hasGivenTitle: !!itemFromApi.given_title,
        hasResolvedTitle: !!itemFromApi.resolved_title,
        hasGivenUrl: !!itemFromApi.given_url,
        hasResolvedUrl: !!itemFromApi.resolved_url,
        hasTags: Object.keys(itemFromApi.tags || {}).length > 0,
      }
    },

    filter: function (rawItems, query, currentUrl) {
      Logger.log(`(Items.filter) query=${query}, currentUrl=${currentUrl}`)
      return parseItems(rawItems).filter(item => {
        let mustKeep = true

        // Don't return the currentUrl item, it's handled outside this items list
        if (currentUrl) mustKeep = mustKeep && !Items.matches(item, currentUrl)
        if (query) mustKeep = mustKeep && matchQuery(item, query)

        return mustKeep
      })
    },

    contains: function (rawItems, url) {
      const parsedItems = parseItems(rawItems)
      return parsedItems.some(item => Items.matches(item, url))
    },

    findByUrl: function (rawItems, url) {
      const parsedItems = parseItems(rawItems || [])
      return parsedItems.find(item => Items.matches(item, url))
    },

    findById: function (rawItems, id) {
      const parsedItems = parseItems(rawItems || [])
      return parsedItems.find(item => item.id === id)
    },

    // TODO: I call both filter and paginate most of the time...but for consistency, I should
    //       call paginate with raw items as well?
    paginate: function (parsedItems, page, perPage) {
      const itemsCount = parsedItems.length
      const sortedItems = parsedItems.sort((a, b) => b.created_at - a.created_at)

      if (!perPage || itemsCount === 0) {
        return sortedItems
      }

      const pagesCount = Math.ceil(itemsCount / perPage)

      if (page <= 0 || page > pagesCount) {
        Logger.warn(`Could not get page ${page} (${itemsCount} items, asked ${perPage} per page)`)
      } else {
        const fromIndex = (page - 1) * perPage
        const toIndex = page * perPage - 1

        return sortedItems.slice(fromIndex, toIndex + 1)
      }
    },

    favoriteItem: function (itemId) {
      setFavorite(itemId, "favorite")
    },
    unfavoriteItem: function (itemId) {
      setFavorite(itemId, "unfavorite")
    },

    updateItem: function (itemId, details) {
      Logger.log(`(Items.updateItem) Item '${itemId}'`)

      browser.storage.local.get(["access_token", "items"]).then(({ access_token, items }) => {
        Badge.startLoadingSpinner()
        const requester = new PocketApiRequester(access_token)

        requester
          .update(itemId, details)
          .then(response => {
            const parsedItems = Utility.parseJson(items) || []

            // Update item in parsedItems
            const updatedItem = parsedItems.find(item => item.id == itemId)
            updatedItem.title = details.title
            updatedItem.tags = details.tags

            // TODO: store the time_updated? but it's not in the add/send payload
            //       maybe the time_updated being touched, it will simply come
            //       in the next regular sync?

            // Save item list in storage and update badge count
            browser.storage.local.set({ items: JSON.stringify(parsedItems) })

            // Send a message back to the UI
            // TODO: is this needed? I don't use it right now
            browser.runtime
              .sendMessage({ action: "updated", id: itemId })
              .catch(error => Logger.warn(`'action: updated' message could not be delivered: ${error}`))

            // Display an indicator on the badge that everything went well
            Badge.flashSuccess()
          })
          .catch(error => {
            BugReporter.captureException(error)
            Logger.error(`(Items.updateItem) Error for update : ${error}`)
            Badge.flashError()
          })
      })
    },

    // rawObjectsToAdd = objects passed to addItem to be added to Pocket
    // they're all of the following form: { url:, title:, tabId: }
    addItem: function (rawObjectsToAdd) {
      Logger.log(`(Items.addItem) Trying to add ${rawObjectsToAdd.length} items to Pocket`)

      browser.storage.local.get(["access_token", "items"]).then(({ access_token, items }) => {
        const newRawObjectsToAdd = rawObjectsToAdd.filter(item => !Items.contains(items, item.url))
        if (newRawObjectsToAdd.length === 0) {
          browser.runtime
            .sendMessage({ notice: PocketNotice.ALREADY_IN_LIST })
            .catch(error =>
              Logger.warn(`'notice: ${PocketNotice.ALREADY_IN_LIST}' message could not be delivered: ${error}`),
            )
          return
        }

        Badge.startLoadingSpinner()
        const requester = new PocketApiRequester(access_token)
        const request =
          newRawObjectsToAdd.length === 1
            ? requester.add(newRawObjectsToAdd[0])
            : requester.addBatch(newRawObjectsToAdd)

        request
          .then(response => {
            const parsedItems = Utility.parseJson(items) || []
            const rawAddedItems = getItemFromAddEndpointResponse(newRawObjectsToAdd.length, response)
            const enrichedAddedItems = enrichItemsFromApi(rawAddedItems, newRawObjectsToAdd)

            reportUnexpectedAddItemResponse(newRawObjectsToAdd.length, response, rawAddedItems)

            enrichedAddedItems.forEach(newItem => {
              parsedItems.push(formatPotentiallyNotParsedPocketItemForStorage(newItem))
            })

            // Save item list in storage and update badge count
            browser.storage.local.set({ items: JSON.stringify(parsedItems) })

            // Send a message back to the UI
            // TODO: send multiple ids? what are they used for?
            const itemIdsToSendInEvent = rawAddedItems.map(item => item.item_id)
            browser.runtime
              .sendMessage({
                action: "added-item",
                id: itemIdsToSendInEvent,
              })
              .catch(error =>
                Logger.warn(
                  `'action: added-item, id: ${itemIdsToSendInEvent}' message could not be delivered: ${error}`,
                ),
              )

            // Display an indicator on the badge that everything went well
            Badge.flashSuccess().then(() => {
              // If setting is enabled, close the tabs
              const tabIds = newRawObjectsToAdd.map(item => item.tabId).filter(Boolean)
              closeTabsIfNeeded(tabIds)

              // Redraw every page pageAction
              Logger.log("(Items.addItem) new items added, update matching pageActions")
              const addedUrls = enrichedAddedItems.flatMap(item => {
                return Utility.getPossibleUrls({
                  id: item.id,
                  url: item.given_url,
                }).filter(url => typeof url === "string")
              })

              browser.tabs.query({ url: addedUrls }).then(tabs => {
                const tabIds = tabs.map(tab => tab.id)
                PageAction.drawEnabled(...tabIds)
              })
            })
          })
          .catch(error => {
            BugReporter.captureException(error)
            Logger.error(`(Items.addItem) Error while adding item: ${error}`)
            Badge.flashError()
          })
      })
    },

    markAsRead: function (itemId, tabId) {
      removeItem(itemId, "archive", tabId)
    },

    deleteItem: function (itemId, tabId) {
      removeItem(itemId, "delete", tabId)
    },

    openItem: async (item, forceNewTab = false, getTargetTab) => {
      await Settings.init()
      const openInNewTab = Settings.get("openInNewTab") || forceNewTab
      const archiveWhenOpened = Settings.get("archiveWhenOpened")
      const options = { url: item.url }
      if (openInNewTab) {
        browser.tabs.create(options)
      } else {
        const targetTab = getTargetTab && (await getTargetTab())
        if (targetTab) {
          browser.tabs.update(targetTab.id, options)
        } else {
          browser.tabs.update(options)
        }
      }

      if (archiveWhenOpened) {
        Items.markAsRead(item.id)
      }
    },

    openRandom: function (query = "") {
      const pCurrentTab = browser.tabs.query({ active: true, currentWindow: true }).then(([t]) => t)
      browser.storage.local.get("items").then(({ items }) => {
        const filteredItems = Items.filter(items, query)

        if (filteredItems.length > 0) {
          const item = filteredItems[Math.floor(Math.random() * filteredItems.length)]
          Items.openItem(item, undefined, () => pCurrentTab)
        }
      })
    },

    openFirst: function (query = "") {
      browser.storage.local.get("items").then(({ items }) => {
        const filteredItems = Items.filter(items, query)

        if (filteredItems.length > 0) {
          const sortedItems = filteredItems.sort((a, b) => b.created_at - a.created_at)
          const firstItem = sortedItems[0]
          Items.openItem(firstItem)
        }
      })
    },

    areSame: function (item1, item2) {
      const sameTitle = item1.title === item2.title
      const item1Tags = (item1.tags || []).sort()
      const item2Tags = (item2.tags || []).sort()
      const sameTags = JSON.stringify(item1Tags) === JSON.stringify(item2Tags)
      return sameTitle && sameTags
    },

    matches: function (item, url) {
      const allPossibleUrls = Utility.getPossibleUrls(item)

      return allPossibleUrls.some(possibleUrl => {
        if (typeof possibleUrl === "string") {
          return possibleUrl === url
        } else if (possibleUrl instanceof RegExp) {
          return possibleUrl.test(url)
        } else {
          throw new Error("Unexpected URL format")
        }
      })
    },
  }
})()

export default Items
