import Conversations from "../models/conversations.js"
import { updateConversation } from "../request/index.js"
import util from "util"
import { v4 as uuidv4 } from "uuid"

export default async function updateConversationController(data) {
  const deltaId = uuidv4()
  let conversation = Conversations.getById(data.conversationId)

  try {
    const delta = data.binaryDelta
    if (!delta) {
      throw "Delta is empty"
    }

    conversation.applyBinaryDelta(delta, deltaId, true)

    let room = `conversation/${data.conversationId}`
    let { success, newValue } = await applyUpdate(data, conversation)

    if (success) {
      // Broadcast updates on the room
      this.broadcast.to(room).emit("conversation_updated", {
        origin: data.origin,
        newValue,
        delta,
      })

      conversation.deleteUndoManager(deltaId)
    } else throw "Update failed"
  } catch (error) {
    conversation.undo(deltaId)
    this.emit("error")
    console.error(error)
  }

  conversation.deleteUndoManager(deltaId)
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
  return await requestAPI(data, "name", newValue)
}

async function applyUpdateDescription(data, conversation) {
  let newValue = conversation.getConversationDescription()
  return await requestAPI(data, "description", newValue)
}

async function applyUpdateSpeakerName(data, conversation) {
  let newSpk = conversation.getSpeakers()
  return await requestAPI(data, "speakers", newSpk)
}

async function applyUpdateText(data, conversation) {
  let newValue = conversation.getConversationText()
  return await requestAPI(data, "text", newValue)
}

async function requestAPI(data, key, newValue) {
  let update = await updateConversation(
    data.conversationId,
    { [key]: newValue },
    data.userToken
  )

  return { success: update?.status == "success", newValue }
}
