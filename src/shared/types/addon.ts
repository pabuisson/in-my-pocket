import { TabId } from "./browser"

type RuntimeActions =
  | "add-item"
  | "authenticate"
  | "delete-item"
  | "favorite"
  | "flash-error"
  | "mark-as-read"
  | "random-item"
  | "read-item"
  | "retrieve-items"
  | "unfavorite"
  | "update-badge-count"
  | "update-item"

type RuntimeFeedbackActions =
  | "added-item"
  | "authenticated"
  | "deleted"
  | "favorited"
  | "marked-as-read"
  | "retrieved-items"
  | "unfavorited"

// TODO: is item a pocket item?
// TODO: error is a constant already
interface RuntimeEvent {
  action: RuntimeActions | RuntimeFeedbackActions
  id: string
  url: string
  title: string
  tabId: TabId
  force: boolean
  openInNewTab: boolean
  query: string
  item: any
  error: string
  full: boolean // NOTE: only for retrieved-items action
  resetDelay: string // NOTE: string coming from the API but containing a number
  notice: string
}

export { RuntimeEvent }
