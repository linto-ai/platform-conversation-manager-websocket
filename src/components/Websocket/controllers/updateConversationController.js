import Conversations from "../models/conversations.js"
import { updateConversation } from "../request/index.js"

export default async function updateConversationController(data) {
  try {
    let conversation = Conversations.getById(data.conversationId)
    const delta = data.binaryDelta
    conversation.applyBinaryDelta(delta)

    let room = `conversation/${data.conversationId}`
    let { success, newValue } = await applyUpdate(data, conversation)

    if (success) {
      // Broadcast updates on the room
      this.broadcast.to(room).emit("conversation_updated", {
        origin: data.origin,
        newValue,
        delta,
      })
    } else throw "Update failed"
  } catch (error) {
    // TODO: rollback yjs update
    console.error(error)
  }
}

async function applyUpdate(data, conversation) {
  switch (data.origin) {
    case "conversation_name":
      return await applyUpdateName(data, conversation)
    case "conversation_description":
      return await applyUpdateDescription(data, conversation)
    case "conversation_text":
      return await applyUpdateText(data, conversation)
    case "default":
      break
  }
}

async function applyUpdateName(data, conversation) {
  let newValue = conversation.getConversationName()
  conversation.updateObj("name", newValue)
  return await requestAPI(data, "name", newValue)
}

async function applyUpdateDescription(data, conversation) {
  let newValue = conversation.getConversationDescription()
  conversation.updateObj("description", newValue)
  return await requestAPI(data, "description", newValue)
}

async function applyUpdateText(data, conversation) {
  let newValue = conversation.getConversationText()
  console.log(newValue)
  //conversation.updateObj("text", newValue)
  return { sucess: true }
}

async function requestAPI(data, key, newValue) {
  let update = await updateConversation(
    data.conversationId,
    { [key]: newValue },
    data.userToken
  )

  return { success: update.status == "success", newValue }
}
