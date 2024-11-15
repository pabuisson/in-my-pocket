import { TabId } from "./browser"

type ItemId = string | number
type Datetime = any

// JS object intended to be sent to Pocket, with the very minimum data
interface RawItem {
  url: string
  title?: string
  tabId?: TabId
}

interface ItemFromApi {
  item_id: ItemId
  id: ItemId
  title: string
  given_url: string
  resolved_url: string
  given_title: string
  resolved_title: string
  favorite: "0" | "1"
  time_added: Datetime
  time_updated: Datetime
  status: any
  tags: {}
}

// TODO: naming: ItemFromStorage
interface Item {
  id: ItemId
  url: string
  title: string
  tags: Array<string>
  fav: "0" | "1"
  created_at: Datetime
  updated_at: Datetime
}

interface UpdateItemData {
  id: ItemId
  title: string
  tags: Array<string>
  previousTags: Array<string>
  url: string
  created_at: any
}

export { ItemId, RawItem, ItemFromApi, Item, UpdateItemData }
