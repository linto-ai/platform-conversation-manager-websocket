import Component from "../component.js"
import { unfocusField } from "./controllers/unfocusFieldController.js"

import { Server as WsServer } from "socket.io"
import { env } from "process"
import Conversations from "./models/conversations.js"
import updateConversationController from "./controllers/updateConversationController.js"
import updateUserRightsController from "./controllers/updateUserRightsController.js"
import jobTranscriptionController from "./controllers/jobTranscriptionController.js"

export default class Websocket extends Component {
  constructor(app) {
    super(app, "WebServer")
    this.id = this.constructor.name
    this.app = app
    this.clients = []

    this.app.io = new WsServer(this.app.components["WebServer"].httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: env.WEBSERVER_WS_PATH,
    })

    this.app.io.on("connection", async (socket) => {
      console.log("Socket CONNECTED")
      await this.initConversation(socket)

      socket.on("disconnect", () => {
        console.log("Socket DISCONNECTED")
      })

      // Update user rights (share/members)
      socket.on("update_users_rights", async (data) => {
        updateUserRightsController.bind(socket)(data)
      })

      socket.on("conversation_update", async (data) => {
        updateConversationController.bind(socket)(data)
      })

      socket.on("focus_field", (data) => {
        let conversation = Conversations.getById(data.conversationId)
        conversation.updateUsers(data.userId, data.field)

        socket.emit("user_focus_field", {
          users: conversation.getUsersList(),
        })

        socket
          .to(`conversation/${data.conversationId}`)
          .emit("user_focus_field", {
            users: conversation.getUsersList(),
          })
      })

      socket.on("unfocus_field", (data) => {
        unfocusField(data.conversationId, data.userId, socket, true)
      })
    })

    this.app.io.of("/").adapter.on("create-room", (room) => {
      console.log(`room ${room} was created`)
    })

    this.app.io.of("/").adapter.on("join-room", (room, id) => {
      console.log(`socket ${id} has joined room ${room}`)
    })

    this.app.io.of("/").adapter.on("leave-room", (room, id) => {
      if (room.indexOf("conversation") !== -1) {
        unfocusField(room.split("/")[1], this.clients[id], this.app.io, false)
      }
      console.log(`>>> socket ${id} has left room ${room}`)
    })
  }

  async initConversation(socket) {
    const connectionData = socket.handshake.query
    const conversationId = connectionData.conversationId
    const userToken = connectionData.userToken
    const userId = connectionData.userId
    let conversation =
      Conversations.getById(conversationId) ||
      (await Conversations.requestConversation(conversationId, userToken))
    /*let conversation = await Conversations.requestConversation(
      conversationId,
      userToken
    )*/
    if (!conversation) return

    socket.emit("load_conversation", {
      conversation: conversation.getObj(),
      users: conversation.getUsersList(),
      ydoc: conversation.encodeStateVector(),
    })

    conversation.addUser(userId)
    this.clients[socket.id] = userId

    socket.join(`conversation/${conversationId}`)

    jobTranscriptionController(
      conversation,
      conversationId,
      userToken,
      this.app.io
    )
  }
}
