import Component from "../component.js"
import {
  updateConversation,
  updateUserRightInConversation,
} from "./request/index.js"

import { Server as WsServer } from "socket.io"
import Conversations from "./models/conversations.js"

export default class Websocket extends Component {
  constructor(app) {
    super(app, "WebServer")
    this.id = this.constructor.name
    this.app = app

    this.app.io = new WsServer(this.app.components["WebServer"].httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    this.app.io.on("connection", async (socket) => {
      console.log("Socket CONNECTED")
      await this.initConversation(socket)

      socket.on("disconnect", () => {
        console.log("Socket DISCONNECTED")
      })

      // Update user rights (share/members)
      socket.on("update_users_rights", async (data) => {
        console.log("Socket update_users_rights", data)
        let update = await updateUserRightInConversation(
          data.conversationId,
          data.userId,
          data.right,
          data.userToken
        )

        console.log("update", update)
      })
      socket.on("conversation_update", async (data) => {
        let conversation = Conversations.getById(data.conversationId)
        conversation.applyBinaryDelta(data.binaryDelta)

        if (data.origin === "conversation_name") {
          let newName = conversation.getConversationName()
          conversation.updateObj("name", newName)

          let updateTitle = await updateConversation(
            data.conversationId,
            { name: newName },
            data.userToken
          )
          if (updateTitle.status === "success") {
            socket.dispatch("conversation_update", {
              conversationId: data.conversationId,
              key: "name",
              value: newName,
            })
          }
        }
      })
    })

    //todo : on('converastion/conversationId/sync', () => return conversation(retained, last updated))
  }

  async initConversation(socket) {
    const connectionData = socket.handshake.query
    const conversationId = connectionData.conversationId
    const userToken = connectionData.userToken

    let conversation =
      Conversations.getById(conversationId) ||
      (await Conversations.requestConversation(conversationId, userToken))

    socket.emit("load_conversation", {
      conversation: conversation.getObj(),
      ydoc: conversation.encodeStateVector(),
    })
  }
}
