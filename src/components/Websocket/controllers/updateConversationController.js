import Conversations from "../models/conversations.js"
import { updateConversation } from "../request/index.js"

export default async function updateConversationController(data) {
  let conversation = Conversations.getById(data.conversationId)
  const delta = data.binaryDelta
  conversation.applyBinaryDelta(delta)

  console.log("updateConversationController")
  let success = false
  let newValue = ""
  let room = `conversation_updated_${data.conversationId}`

  if (data.origin === "conversation_name") {
    let newName = conversation.getConversationName()
    conversation.updateObj("name", newName)

    // ok

    let updateTitle = await updateConversation(
      data.conversationId,
      { name: newName },
      data.userToken
    )
    newValue = newName
    success = updateTitle.status == "success"
  }

  if (success) {
    console.log("sucess")
    // this.emit("success")
    this.broadcast.emit(room, {
      origin: data.origin,
      newValue,
      delta,
    })
  }
}
