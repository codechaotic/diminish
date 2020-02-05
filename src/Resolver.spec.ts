/* tslint:disable:no-unused-expression no-empty */

import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import * as chaiAsPromised from 'chai-as-promised'

import * as Diminish from '.'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect

describe('Resolver', function () {
  let parse: sinon.SinonStub<any, any>
  let registry: { [key in keyof Diminish.Registry<any>]: sinon.SinonStub }
  let Registry: sinon.SinonStub<any, any>

  function createResolver (name, producer) {
    const resolver = new Diminish.Resolver(registry as any, name, producer)
    registry.get.withArgs(name).returns(resolver)
    return resolver
  }

  beforeEach(function () {
    parse = sinon.stub(Diminish, 'parse')
    registry = {
      get: sinon.stub(),
      set: sinon.stub(),
      has: sinon.stub()
    }
    Registry = sinon.stub(Diminish, 'Registry') as any
    Registry.returns(registry)
  })

  afterEach(function () {
    parse.restore()
    Registry.restore()
  })

  describe('#_apply', function () {
    it('should be a method', function () {
      const resolver = createResolver('x', () => {}) as any
      expect(resolver._apply).to.be.a('function')
    })

    it('should call a function with given arguments', function () {
      parse.returns({ type: 'function', args: [] })
      let args!: any[]
      const resolver = createResolver('x', (...x: any[]) => { args = x }) as any
      resolver._apply(null, [1, 2])
      expect(args).to.deep.eq([1, 2])
    })

    it('should create call a constructor with given arguments', function () {
      parse.returns({ type: 'class', args: [] })
      let args!: any[]
      const resolver = createResolver('x', class { constructor (...x: any[]) { args = x } }) as any
      resolver._apply(null, [1, 2])
      expect(args).to.deep.eq([1, 2])
    })

    it('should call function with a custom context', function () {
      parse.returns({ type: 'function', args: [] })
      let context = { value: 10 }
      let actual: any
      const resolver = createResolver('x', function (this: any) { actual = this }) as any
      resolver._apply(context, [])
      expect(actual).to.eq(context)
    })

    it('should error when calling a constructor with a custom context', function () {
      parse.returns({ type: 'class', args: [] })
      let context = { value: 10 }
      const resolver = createResolver('x', class { constructor () { '' } }) as any
      expect(() => resolver._apply(context, [])).to.throw('cannot be called with custom context')
    })

    it('should error when calling an arrow function with a custom context', function () {
      parse.returns({ type: 'arrow', args: [] })
      let context = { value: 10 }
      const resolver = createResolver('x', () => {}) as any
      expect(() => resolver._apply(context, [])).to.throw('cannot be called with custom context')
    })
  })

  describe('#_resolve', function () {
    it('should be a method', function () {
      const resolver = createResolver('x', () => {}) as any
      expect(resolver._resolve).to.be.a('function')
    })

    it('should resolve and inject dependencies', function () {
      parse.returns({ type: 'function', args: ['a'] })
      const resolver = createResolver('x', () => {}) as any
      const _apply = sinon.stub(resolver, '_apply')
      registry.get.withArgs('a').returns({
        resolve: sinon.stub().returns(true)
      })
      resolver._resolve()
      expect(_apply).to.have.been.calledWith(null, [true])
    })

    it('should reconstruct deconstructed dependencies', function () {
      parse.returns({ type: 'function', args: [['a']] })
      const resolver = createResolver('x', () => {}) as any
      const _apply = sinon.stub(resolver, '_apply')
      registry.get.withArgs('a').returns({
        resolve: sinon.stub().returns(true)
      })
      resolver._resolve()
      expect(_apply).to.have.been.calledWith(null, [{ a: true }])
    })

    it('should await asynchronous dependencies', async function () {
      parse.returns({ type: 'function', args: ['a'] })
      const resolver = createResolver('x', () => {}) as any
      const _apply = sinon.stub(resolver, '_apply')
      registry.get.withArgs('a').returns({
        resolve: sinon.stub().resolves(true)
      })
      await resolver._resolve()
      expect(_apply).to.have.been.calledWith(null, [true])
    })

    it('should await asynchronouse deconstructed dependencies', async function () {
      parse.returns({ type: 'function', args: [['a']] })
      const resolver = createResolver('x', () => {}) as any
      const _apply = sinon.stub(resolver, '_apply')
      registry.get.withArgs('a').returns({
        resolve: sinon.stub().resolves(true)
      })
      await resolver._resolve()
      expect(_apply).to.have.been.calledWith(null, [{ a: true }])
    })

    it('should return a promise if provider is asynchronous', function () {
      parse.returns({ type: 'function', args: [] })
      const resolver = createResolver('x', async () => {}) as any
      const result = resolver._resolve(null)
      expect(result).to.be.instanceof(Promise)
    })

    it('should return a promise if a dependency is asynchronous', function () {
      parse.returns({ type: 'function', args: ['a'] })
      const resolver = createResolver('x', () => {}) as any
      registry.get.withArgs('a').returns({
        resolve: sinon.stub().resolves(true)
      })
      const result = resolver._resolve()
      expect(result).to.be.instanceof(Promise)
    })

    it('should call provider with a custom context', function () {
      parse.returns({ type: 'function', args: [] })
      const resolver = createResolver('x', () => {}) as any
      const _apply = sinon.stub(resolver, '_apply')
      const context = {}
      resolver._resolve(context)
      expect(_apply).to.have.been.calledWith(context, [])
    })
  })

  describe('#isCircular', function () {
    it('should be a method', function () {
      const resolver = createResolver('x', () => {})
      expect(resolver.isCircular).to.be.a('function')
    })

    it('should return true if search path includes self', function () {
      parse.returns({ type: 'function', args: ['x'] })
      const resolver = createResolver('x', () => {})
      expect(resolver.isCircular(['x'])).to.be.true
    })

    it('should return true if dependencies includes self', function () {
      parse.returns({ type: 'function', args: ['x'] })
      const resolver = createResolver('x', () => {})
      expect(resolver.isCircular([])).to.be.true
    })

    it('should return true a dependency is circular', function () {
      parse.onFirstCall().returns({ type: 'function', args: ['y'] })
      parse.onSecondCall().returns({ type: 'function', args: ['y'] })
      const firstResolver = createResolver('x', () => {})
      const secondResolver = createResolver('y', () => {})
      expect(secondResolver.isCircular()).to.be.true
      expect(firstResolver.isCircular()).to.be.true
    })

    it('should return false if not circular', function () {
      parse.returns({ type: 'function', args: ['x', 'x'] })
      const resolver = createResolver('y', () => {})
      expect(resolver.isCircular()).to.be.false
    })
  })

  describe('#resolve', function () {
    it('should be a method', function () {
      const resolver = createResolver('x', () => {})
      expect(resolver.resolve).to.be.a('function')
    })

    it('should error if there are circular dependencies', function () {
      const resolver = createResolver('x', () => {})
      const isCircular = sinon.stub(resolver, 'isCircular')
      isCircular.returns(true)
      expect(() => resolver.resolve()).to.throw('has circular dependencies')
    })

    it('should return cached value if already resolved', function () {
      const resolver = createResolver('x', () => {})
      const isCircular = sinon.stub(resolver, 'isCircular')
      isCircular.returns(false)

      const exposed: any = resolver
      exposed._ready = true
      exposed._value = true

      expect(resolver.resolve()).to.be.true
    })

    it('should return promise if async resolution already in progress', async function () {
      const resolver = createResolver('x', () => {})
      const isCircular = sinon.stub(resolver, 'isCircular')
      isCircular.returns(false)

      const exposed: any = resolver
      exposed._promise = Promise.resolve(true)

      const result = resolver.resolve()
      expect(result).to.be.instanceof(Promise)

      expect(await result).to.be.true
    })

    it('should cache and return a resolved value', function () {
      const resolver = createResolver('x', () => {})
      const isCircular = sinon.stub(resolver, 'isCircular')
      isCircular.returns(false)

      const exposed: any = resolver
      const _resolve: sinon.SinonStub<any[], any> = sinon.stub(exposed, '_resolve')
      _resolve.returns(true)

      const result = resolver.resolve()
      expect(result).to.be.true
      expect((resolver as any)._ready).to.be.true
      expect(exposed._value).to.be.true
    })

    it('should create a store a promise for async values', async function () {
      const resolver = createResolver('x', () => {})
      const isCircular = sinon.stub(resolver, 'isCircular')
      isCircular.returns(false)

      const exposed: any = resolver
      const _resolve: sinon.SinonStub<any[], any> = sinon.stub(exposed, '_resolve')
      _resolve.resolves(true)

      const result = resolver.resolve()
      expect(result).to.be.instanceof(Promise)
      expect(exposed._promise).to.equal(result)
    })
  })
})
