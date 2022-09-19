import Component from "../component.js"

export default class AlphabetSoup extends Component {
  constructor(app) {
    super(app)
    this.id = this.constructor.name
    this.app = app
  }
}
