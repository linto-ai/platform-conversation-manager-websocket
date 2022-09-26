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
    if (getConversation) {
      return this.add(getConversation.data, conversationId)
    } else {
      return null
    }
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
    this.users = []

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
  getConversationDescription() {
    return this.ydoc.getText("description").toString()
  }
  initYjsFromObj(conversationObj) {
    this.name = this.ydoc.getText("name")
    this.name.insert(0, conversationObj.name)
  }

  listUsers() {
    return this.users
  }
  getUserById(userId) {
    return this.users[userId]
  }
  addUser(userId) {
    this.users[userId] = new User(userId)
    return this.users[userId]
  }
  removeUser(userId) {
    this.users[userId] = null
  }
  destroy() {
    this.ydoc.destroy()
  }
  setCursorPosition(userId, cursorPos, inputField) {
    this.users[userId].cursorPosition = cursorPos
    this.users[userId].inputField = inputField
  }
  unsetCursorPosition(userId) {
    this.users[userId].cursorPosition = null
    this.users[userId].inputField = null
  }
  getUsersList() {
    let usersList = []
    for (let userId in this.users) {
      usersList.push({
        userId: userId,
        cursorPosition: this.users[userId].cursorPosition,
        inputField: this.users[userId].inputField,
      })
    }
    return usersList
  }
}

export class User {
  constructor(userId) {
    this.userId = userId
    this.cursorPosition = null
    this.inputField = null
  }
}
