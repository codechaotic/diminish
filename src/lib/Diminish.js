module.exports = {
  createContainer () {
    const Container = require('./Container')
    return new Container()
  },
  createResolver (definition) {
    const Resolver = require('./Resolver')
    return new Resolver(definition)
  },
  isContainer (x) {
    const Container = require('./Container')
    return x instanceof Container
  },
  isResolver (x) {
    const Resolver = require('./Resolver')
    return x instanceof Resolver
  },
  parse (fn) {
    const parse = require('./parse')
    return parse(fn)
  }
}
