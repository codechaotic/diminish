const Diminish = require('./Diminish')
const assert = require('assert')

// Hide private properties in a WeakMap
const data = new WeakMap()

/**
 * Class Container
 */
module.exports = class Container {
  constructor () {
    // initialize private properties
    data.set(this, { registry: new Map() })
  }

  get registry () { return data.get(this).registry }

  /**
   * Method Resolve
   * Resolves a registered resolver if it has been defined.
   */
  async resolve (name) {
    assert(typeof name === 'string', `Parameter 'name' must be a string`)
    assert(name !== '', `Parameter 'name' must have length > 0`)
    assert(this.registry.has(name), `No registered dependency '${name}`)

    // Get the resolver
    const dependency = this.registry.get(name)

    // Resolve if dependency is a resolver, otherwise
    // it's a literal so return it as is.
    let result
    if (Diminish.isResolver(dependency)) {
      result = await dependency.resolve(this)
    } else result = dependency
    return result
  }

  async invoke () {
    const [fn, context] = arguments
    assert(typeof fn === 'function', `First parameter must be a function or class`)
    const resolver = Diminish.createResolver(fn)
    if (context) return resolver.resolve(this, context)
    else return resolver.resolve(this)
  }

  /**
   * Method resolver
   * Register a new resolver. This can be either a name and resolver or an
   * object with resolver values. A resolver is either a Class of Function
   * with resolvable parameters (see Resolver)
   */
  resolver () {
    switch (typeof arguments[0]) {
      case 'string':
        const [name, definition] = arguments
        assert(name !== '', `Parameter 'name' must have length > 0`)
        assert(!this.registry.has(name), `Dependency already registered for name '${name}`)

        this.registry.set(name, Diminish.createResolver(definition))
        break
      case 'object':
        const [obj] = arguments
        assert(obj !== null, `First parameter must be a string or object`)
        assert(!Array.isArray(obj), `First parameter must be a string or object`)
        for (const name in obj) {
          assert(name !== '', `Parameter 'name' must have length > 0`)
          assert(!this.registry.has(name), `Dependency already registered for name '${name}`)

          this.registry.set(name, Diminish.createResolver(obj[name]))
        }
        break
      default:
        throw new Error(`First parameter must be a string or object`)
    }
  }

  /**
   * Method literal
   * Register a new literal. This can be either a name and value or an
   * object.
   */
  literal () {
    switch (typeof arguments[0]) {
      case 'string':
        const [name, value] = arguments
        assert(name !== '', `Name must have length > 0`)
        assert(!this.registry.has(name), `Dependency '${name}' already registered`)
        this.registry.set(name, value)
        break
      case 'object':
        const [obj] = arguments
        assert(obj !== null, `First parameter must be a string or object`)
        assert(!Array.isArray(obj), `First parameter must be a string or object`)
        for (const name in obj) {
          assert(name !== '', `Name must have length > 0`)
          assert(!this.registry.has(name), `Dependency '${name}' already registered`)
          this.registry.set(name, obj[name])
        }
        break
      default:
        throw new Error(`First parameter must be a string or object`)
    }
  }

  /**
   * Method delete
   * Removes a registered resolver or literal by name
   */
  delete (name) {
    return this.registry.delete(name)
  }

  /**
   * Method has
   * returns true if a resovler or literal value has been registered for name
   */
  has (name) {
    return this.registry.has(name)
  }

  /**
   * Method reset
   * Removes the cached internal value for a registered resolver
   */
  reset (name) {
    if (this.registry.has(name)) {
      const dependency = this.registry.get(name)
      if (Diminish.isResolver(dependency)) {
        dependency.reset()
        return true
      }
    }
    return false
  }
}
