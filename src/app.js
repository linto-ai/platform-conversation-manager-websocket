import ora from "ora"
import process from "process"
import * as dotenv from "dotenv"

class App {
  constructor() {
    console.log("Starting web server")
    try {
      dotenv.config()

      this.components = {}

      process.env.COMPONENTS
        ? this.loadComponents()
        : console.log("No components registered")
    } catch (e) {
      console.error(e)
    }
  }

  async loadComponents() {
    this.components = process.env.COMPONENTS.split(",").map(
      async (componentFolderName) => await this.use(componentFolderName)
    )
  }

  async use(componentFolderName) {
    let spinner = ora(`Registering component : ${componentFolderName}`).start()
    try {
      // Component dependency injections with inversion of control based on events emitted between components
      // Component is an async singleton - requiring it returns a reference to an instance
      const componentImport = await import(
        `./components/${componentFolderName}/index.js`
      )
      const component = new componentImport.default(this)
      this.components[component.id] = component // We register the instancied component reference in app.components object
      spinner.succeed(`Registered component : ${component.id}`)
    } catch (e) {
      if (e.name == "COMPONENT_MISSING") {
        return spinner.warn(
          `Skipping ${componentFolderName} - this component depends on : ${e.missingComponents}`
        )
      }
      spinner.fail(`Error in component loading : ${componentFolderName}`)
      console.error(e)
      process.exit(1)
    }
  }
}

new App()
