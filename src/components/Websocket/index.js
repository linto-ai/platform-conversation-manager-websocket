import Component from "../component.js"
import { Server as WsServer } from "socket.io"

export default class Websocket extends Component {
  constructor(app) {
    super(app, "WebServer")
    this.id = this.constructor.name
    this.app = app

    this.io = new WsServer(this.app.components["WebServer"].httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })
  }
}
