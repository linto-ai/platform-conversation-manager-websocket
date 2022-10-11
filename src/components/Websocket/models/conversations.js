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

  getConversationText() {
    return this.ydoc.getArray("text").toJSON()
  }

  getSpeakers() {
    return this.ydoc.getArray("speakers").toJSON()
  }

  initYjsFromObj(conversationObj) {
    this.ydoc.getText("name").insert(0, conversationObj.name)
    this.ydoc.getText("description").insert(0, conversationObj.description)

    this.initSpeakers(conversationObj.speakers)
    this.initText(conversationObj.text)
  }

  initText(text) {
    for (const turn of text) {
      this.ydoc.getArray("text").push([Conversation.formatYturn(turn)])
    }
  }

  initSpeakers(speakers) {
    try {
      for (let spk of speakers) {
        let ySpk = { ...spk, speaker_name: new Y.Text() }
        ySpk.speaker_name.insert(0, spk.speaker_name)
        let yspeaker = new Y.Map(Object.entries(ySpk))
        this.ydoc.getArray("speakers").push([yspeaker])
      }
    } catch (error) {
      console.error(error)
    }
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
    this.obj = {}
  }

  updateUsers(userId, inputField) {
    this.users[userId].inputField = inputField
  }

  resetUsers(userId) {
    this.users[userId].inputField = null
  }

  getUsersList() {
    let usersList = []
    for (let userId in this.users) {
      usersList.push({
        userId: userId,
        inputField: this.users[userId].inputField,
      })
    }
    return usersList
  }

  static formatYturn(turnObj) {
    const ywords = Y.Array.from(turnObj.words)
    const ySegment = new Y.Text(turnObj.segment)
    delete turnObj["words"]
    delete turnObj["segment"]
    const yturn = new Y.Map(Object.entries(turnObj))
    yturn.set("words", ywords)
    yturn.set("segment", ySegment)
    return yturn
  }

  static mergeUpdates(deltas) {
    return Y.mergeUpdates(deltas)
  }
}

export class User {
  constructor(userId) {
    this.userId = userId
    this.inputField = null
  }
}
