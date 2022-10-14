import Conversations from "../models/conversations.js"
import { updateConversation } from "../request/index.js"
import util from "util"

export default async function updateConversationController(data) {
  try {
    let conversation = Conversations.getById(data.conversationId)
    const delta = data.binaryDelta
    if (!delta) {
      throw "Delta is empty"
    }
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
    case "conversation_insert_paragraph":
    case "conversation_merge_paragraph":
    case "conversation_edit_speaker":
      return await applyUpdateText(data, conversation)
    case "conversation_add_speaker":
      return await applyAddSpeaker(data, conversation)
    case "conversation_speaker_name":
      return await applyUpdateSpeakerName(data, conversation)
    case "default":
      break
  }
}

async function applyAddSpeaker(data, conversation) {
  let newValue = {
    text: conversation.getConversationText(),
    speakers: conversation.getSpeakers(),
  }

  let update = await updateConversation(
    data.conversationId,
    newValue,
    data.userToken
  )

  return { success: update.status == "success", newValue }
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

async function applyUpdateSpeakerName(data, conversation) {
  let newSpk = conversation.getSpeakers()
  conversation.updateObj("speakers", newSpk)
  return await requestAPI(data, "speakers", newSpk)
}

async function applyUpdateText(data, conversation) {
  let newValue = conversation.getConversationText()
  console.log(util.inspect(newValue, { depth: 4 }))
  conversation.updateObj("text", newValue)
  return await requestAPI(data, "text", newValue)
}

async function requestAPI(data, key, newValue) {
  console.log(util.inspect(newValue, { depth: 4 }))
  let update = await updateConversation(
    data.conversationId,
    { [key]: newValue },
    data.userToken
  )

  return { success: update.status == "success", newValue }
}
