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
    let conv = this.conversations[conversationId]
    if (conv) {
      conv.setObj(conversationObj)
    } else {
      this.conversations[conversationId] = new Conversation(conversationObj)
    }
    return this.conversations[conversationId]
  }
}

export class Conversation {
  constructor(conversationObj) {
    this.ydoc = new Y.Doc()
    this.obj = conversationObj ? conversationObj : {}

    if (conversationObj) {
      this.initYjsFromObj(conversationObj)
    }
  }

  applyBinaryDelta(binaryDelta, transactionName) {
    try {
      this.ydoc.transact(() => {
        Y.applyUpdate(this.ydoc, new Uint8Array(binaryDelta))
      }, transactionName)
      this.stateVector = Y.encodeStateAsUpdate(this.ydoc)

      //Y.logUpdate(new Uint8Array(binaryDelta))

      console.log("new title", this.getConversationName())
    } catch (error) {
      console.error(error)
    }
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

  setObj(obj) {
    this.obj = obj
  }

  getYdoc() {
    return this.ydoc
  }

  getConversationName() {
    return this.ydoc.getText("name").toString()
  }

  initYjsFromObj(conversationObj) {
    this.name = this.ydoc.getText("name")
    this.name.insert(0, conversationObj.name)
    this.name.observe(function (YTextEvent, Transaction) {
      console.log("title update", YTextEvent.changes.delta)
    })
  }
}
