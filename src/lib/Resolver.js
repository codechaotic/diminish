const assert = require('assert')

const Diminish = require('./Diminish')

module.exports = class Resolver {
  constructor (fn) {
    const details = Diminish.parse(fn)
    this.type = details.type
    this.args = details.args
    this.resolved = false
    this.fn = fn
  }

  reset () {
    delete this.value
    this.resolved = false
  }

  async resolve (container, context = null) {
    assert(Diminish.isContainer(container), 'Resolve requires a Container')

    if (this.resolved) return this.value
    else {
      let params = []
      for (const arg of this.args) {
        if (Array.isArray(arg)) {
          const obj = {}
          for (const identifier of arg) {
            obj[identifier] = await container.resolve(identifier)
          }
          params.push(obj)
        } else {
          params.push(await container.resolve(arg))
        }
      }

      let result
      if (this.type === 'class') {
        const args = [null].concat(params)
        const Class = Function.prototype.bind.apply(this.fn, args)
        result = new Class()
      } else if (this.type === 'function') {
        result = await this.fn.apply(context, params)
      } else if (this.type === 'arrow') {
        assert(context === null, 'Cannot apply custom context to arrow function')
        result = await this.fn.apply(context, params)
      } else throw Error('Unknown type')

      this.value = result
      this.resolved = true

      return result
    }
  }
}
