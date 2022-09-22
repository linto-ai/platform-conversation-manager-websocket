import * as Y from "yjs"
import { getConversationById } from "../request/index.js"

export default class Conversations {
  static conversations = {}

  static getById(conversationId) {
    let conv = this.conversations[conversationId]
    if (conv) {
      return conv
    } else {
      return null
    }
  }

  static async requestConversation(conversationId, userToken) {
    let getConversation = await getConversationById(conversationId, userToken)

    return this.add(getConversation.data, conversationId)
  }

  static add(conversationObj, conversationId) {
    const conv = new Conversation(conversationObj)
    this.conversations[conversationId] = conv
    return conv
  }
}

class Conversation {
  constructor(conversationObj) {
    this.ydoc = new Y.Doc()
    this.obj = conversationObj

    this.name = this.ydoc.getText("name")
    this.name.insert(0, conversationObj.name)
  }

  applyBinaryDelta(binaryDelta) {
    Y.applyUpdate(this.ydoc, new Uint8Array(binaryDelta))
  }
  encodeStateVector() {
    return Y.encodeStateAsUpdate(this.ydoc)
  }
  updateObj(key, value) {
    this.obj[key] = value
  }
  getObj() {
    return this.obj
  }
  getYdoc() {
    return this.ydoc
  }
  getConversationName() {
    return this.ydoc.getText("name").toString()
  }
}
