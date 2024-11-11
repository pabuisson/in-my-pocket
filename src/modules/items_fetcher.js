"use strict"

import Badge from "./badge"
import BugReporter from "../modules/bug_reporter"
import Items from "./items"
import Logger from "./logger"
import PageAction from "./page_action"
import Request from "./request"
import Utility from "./utility"
import { VersionManager } from "./version_manager"
import { consumerKey, PocketApiStatus } from "./constants"

const ItemsFetcher = (function () {
  /* Expected format:
   * - an object,
   * - with a status attribute (not documented)
   * - with a list attribute. `list` is an object, each key is an item ID, each value is the actual item
   */
  function isGetResponseValid(response) {
    const isResponseAnObject = typeof response == "object" && !Array.isArray(response)
    if (!isResponseAnObject) return false

    const doesResponseContainExpectedAttributes = response.hasOwnProperty("list")
    if (!doesResponseContainExpectedAttributes) return false

    const isListAnObject = typeof response.list == "object" && !Array.isArray(response)
    if (!isListAnObject) return false

    return true
  }

  function reportUnexpectedGetResponse(response, fetchSource) {
    const isResponseAnObject = typeof response == "object" && !Array.isArray(response)

    const payloadKeysAndTypes = Object.keys(response).map(key => {
      const value = response[key]
      // NOTE: I'm not sure we will ever reach this point now that I catch succesful response
      //       with error headers and treat them as a fail HTTP response.
      const valueType = key === "error" ? value : Utility.getType(value)
      return `${key}: ${valueType}`
    })

    const details = {
      fetchSource,
      responseStatus: response.status,
      isResponseAnObject,
      responseKeys: payloadKeysAndTypes,
    }

    Logger.error(`${fetchSource}: unexpected response format :: ${JSON.stringify(details)}`)
    BugReporter.captureMessage(`${fetchSource}: unexpected response format`, details)
  }

  return {
    retrieveItems: function (force) {
      const intervalWithoutReload = 15 * 60
      const currentTimestamp = (Date.now() / 1000) | 0

      browser.storage.local.get(["items", "last_retrieve"]).then(({ items, last_retrieve }) => {
        const timeSinceLastRetrieve = currentTimestamp - last_retrieve
        Logger.log(`(ItemsFetcher.retrieveItems) timeout: ${timeSinceLastRetrieve} / ${intervalWithoutReload}`)

        if (force || !items || !last_retrieve) {
          // If force == true, we always reload the whole list
          ItemsFetcher.retrieveAll()
        } else if (timeSinceLastRetrieve > intervalWithoutReload) {
          // If we already have sync, check if intervalWithoutReload is past, then we can reload
          ItemsFetcher.retrieveDiff()
        } else {
          // Do this to stop the main-loader component
          // TODO: send a stop-loaded message instead of retrieved-items, no?
          //       retrieved-items has side effects on the items list building
          browser.runtime
            .sendMessage({ action: "retrieved-items" })
            .catch(error => Logger.warn(`'action: retrieved-items' message could not be delivered: ${error}`))
          // Update the badge count, in case it wasn't displayed but no items reload happened
          Badge.updateCount()
        }
      })
    },

    retrieveAll: function (offset = 0) {
      Logger.log(`(ItemsFetcher.retrieveAll) Retrieve all items, offset=${offset}`)
      const isRetrievingFirstPage = offset === 0

      browser.storage.local.get(["access_token", "items"]).then(({ access_token, items }) => {
        const existingItems = items && !isRetrievingFirstPage ? Utility.parseJson(items) : []
        const requestParams = {
          consumer_key: consumerKey,
          access_token: access_token,
          offset: offset,
          count: 1000,
          detailType: "complete",
          state: "unread",
          sort: "oldest",
        }

        // https://getpocket.com/developer/docs/v3/retrieve
        new Request("POST", "https://getpocket.com/v3/get", requestParams)
          .fetch()
          .then(response => {
            // NOTE: temporary logging to pinpoint issues with Pocket API
            if (isGetResponseValid(response)) {
              Logger.log("(ItemsFetch.retrieveAll) Response format is valid")
            } else {
              reportUnexpectedGetResponse(response, "retrieveAll")
            }

            const rawRetrievedItems = response.list || {}
            const retrievedItems = Object.values(rawRetrievedItems).map(item =>
              Items.formatFetchedPocketItemForStorage(item),
            )

            // NOTE: I voluntarily use loose equality to get strings and integers, just in case
            const archivedItems = Object.values(rawRetrievedItems).filter(item => item.status == "1")
            const deletedItems = Object.values(rawRetrievedItems).filter(item => item.status == "2")

            if (archivedItems.length > 0 || deletedItems.length > 0) {
              const maxItemsToReport = 4
              BugReporter.captureMessage("retrieveAll: received deleted or archived items", {
                totalItemsCount: retrievedItems.length,
                archivedItemsCount: archivedItems.length,
                archivedItems: archivedItems
                  .slice(0, maxItemsToReport)
                  .map(item => Items.formatPocketItemForDebug(item)),
                deletedItemsCount: deletedItems.length,
                deletedItems: deletedItems.slice(0, maxItemsToReport).map(item => Items.formatPocketItemForDebug(item)),
              })
            }

            const retrievedItemsCount = retrievedItems.length
            if (retrievedItemsCount > 0) {
              Logger.log(`(ItemsFetcher.retrieveAll) ${retrievedItemsCount} items in the response`)
              const allItems = [...existingItems, ...retrievedItems]
              browser.storage.local.set({ items: JSON.stringify(allItems) }).then(() => {
                Badge.updateCount(allItems)
                ItemsFetcher.retrieveAll(retrievedItemsCount + offset)
              })
            } else {
              Logger.log("(ItemsFetcher.retrieveAll) No item in this page, all pages fetched succesfully")
              // Save timestamp where we retrieved *all* items for the last time
              // Save addon version that did the last full sync
              browser.storage.local.set({
                last_retrieve: response.since,
                lastFullSyncAtVersion: VersionManager.getCurrentVersion(),
              })

              browser.runtime
                .sendMessage({ action: "retrieved-items", full: true })
                .catch(error => Logger.warn(`'action: retrieved-items' message could not be delivered: ${error}`))
              PageAction.redrawAllTabs()
            }
          })
          .catch(error => {
            BugReporter.captureException(error)
            Logger.error(`(ItemsFetcher.retrieveAll) Error: ${error}`)
            Badge.flashError()
          })
      })
    },

    retrieveDiff: function () {
      Logger.log("(ItemsFetcher.retrieveDiff)")

      browser.storage.local
        .get(["access_token", "last_retrieve", "items"])
        .then(({ access_token, last_retrieve, items }) => {
          const requestParams = {
            consumer_key: consumerKey,
            access_token: access_token,
            detailType: "complete",
            state: "all",
            since: last_retrieve,
          }

          new Request("POST", "https://getpocket.com/v3/get", requestParams)
            .fetch()
            .then(function (response) {
              // NOTE: temporary logging to pinpoint issues with Pocket API
              if (isGetResponseValid(response)) {
                Logger.log("(ItemsFetch.retrieveDiff) Response format is valid")
              } else {
                reportUnexpectedGetResponse(response, "retrieveDiff")
              }

              Logger.log(Object.keys(response.list).length + " items in the response")
              const allItems = Utility.parseJson(items) || []
              const itemsWithUnknownStatus = []

              for (const itemId in response.list) {
                const item = response.list[itemId]
                const itemIndex = allItems.findIndex(item => item.id === itemId)

                switch (item.status) {
                  case PocketApiStatus.ARCHIVED:
                  case PocketApiStatus.DELETED:
                    Logger.log(`(ItemsFetcher.retriveDiff) NEED TO ARCHIVE: ${itemId} (${item.title})`)

                    if (itemIndex >= 0) {
                      Logger.log("(ItemsFetcher.retrieveDiff) Item found,  will be removed from the stored items")
                      allItems.splice(itemIndex, 1)
                    } else {
                      Logger.warn("(ItemsFetcher.retrieveDiff) Could not find the item to archive in the stored items")
                    }
                    break

                  case PocketApiStatus.CREATED:
                    if (itemIndex >= 0) {
                      Logger.log(`(ItemsFetcher.retriveDiff) Existing item ${itemId} (${item.title}) will be updated`)
                      allItems[itemIndex] = Object.assign(
                        allItems[itemIndex],
                        Items.formatFetchedPocketItemForStorage(item),
                      )
                    } else {
                      Logger.log(`(ItemsFetcher.retriveDiff) Add new item: ${itemId} (${item.title})`)
                      allItems.push(Items.formatFetchedPocketItemForStorage(item))
                    }
                    break

                  default:
                    Logger.log(`(ItemsFetcher.retriveDiff) Unknown item status: ${item.status}`)
                    itemsWithUnknownStatus.push(item)
                    break
                }
              }

              if (itemsWithUnknownStatus.length > 0) {
                const maxItemsToReport = 4
                BugReporter.captureException(new Error("retrieveDiff: items with unknown status"), {
                  totalItemsCount: allItems.length,
                  since: last_retrieve,
                  itemsWithUnknownStatusCount: itemsWithUnknownStatus.length,
                  itemsWithUnknownStatus: itemsWithUnknownStatus
                    .slice(0, maxItemsToReport)
                    .map(item => Items.formatPocketItemForDebug(item)),
                })
              }

              // Save item list in storage and update badge count
              browser.storage.local.set({ items: JSON.stringify(allItems) })
              Badge.updateCount(allItems)

              // Update the last_retrieve timestamp in the database
              // TODO: if there were error, don't update the `last_retrieve` timestamp ? Would it play
              //       nicely with the items that were correctly removed/added?
              browser.storage.local.set({ last_retrieve: response.since })

              // Send a message back to the UI and updates the tabs page actions
              browser.runtime
                .sendMessage({ action: "retrieved-items" })
                .catch(error => Logger.warn(`'action: retrieved-items' message could not be delivered: ${error}`))
              PageAction.redrawAllTabs()
            })
            .catch(error => {
              BugReporter.captureException(error)

              // Even if something went wrong while retrieving diff, we still can display the current
              // items, so we send the `retrieved-items` event back to popup to build the item list
              Logger.warn(`(ItemsFetcher.retrieveDiff) something went wrong: ${error}`)

              // Send a message back to the UI and updates the tabs page actions
              browser.runtime
                .sendMessage({ action: "retrieved-items" })
                .catch(error => Logger.warn(`'action: retrieved-items' message could not be delivered: ${error}`))
              PageAction.redrawAllTabs()

              // Flash the badge if an error occured
              Badge.flashError()
            })
        })
    },
  }
})()

export default ItemsFetcher
