import { updateUserRightInConversation } from "../request/index.js"

export default async function updateUserRightsController(data) {
  try {
    let update = await updateUserRightInConversation(
      data.conversationId,
      data.userId,
      data.right,
      data.userToken
    )

    let room = `conversation/${data.conversationId}`
    if (update.status === "success") {
      // Broadcast updates on the room
      this.broadcast.to(room).emit("user_right_updated", {
        origin: data.origin,
        value: {
          userId: data.userId,
          right: data.right,
        },
      })
      this.to(room).emit("user_right_updated", {
        origin: data.origin,
        value: {
          userId: data.userId,
          right: data.right,
        },
      })
    } else throw "Update failed"
  } catch (error) {
    console.error(error)
  }
}
