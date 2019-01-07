import { Container } from './lib/Container'

interface Test {
  a: number,
  b: string
}
const container = new Container<Test>()

;(async () => {
  try {
    let result : any

    container.literal({
      a () {
        return 10
      },
      b ({ a }) {
        return a
      }
    })

    result = await container.invoke(async ({ b }) => {
      return b
    })

    console.log(result)
  } catch (error) {
    console.log(error)
  }
})()
