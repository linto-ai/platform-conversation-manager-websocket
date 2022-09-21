import Component from "../component.js"
import { getConversationById } from "./request/index.js"

import { Server as WsServer } from "socket.io"

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
      console.log("connection socket")
      const connectionData = socket.handshake.query
      let req = await this.getConversationById(connectionData)

      socket.emit("load_conversation", { conversation: req })
    })

    //todo : on('converastion/conversationId/sync', () => return conversation(retained, last updated))
  }

  async getConversationById(connectionData) {
    return await getConversationById(
      connectionData.conversationId,
      connectionData.userToken
    )
  }
}
