/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import * as chaiAsPromised from 'chai-as-promised'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect

import { Container } from './Container'

describe('Container', function () {
  let isResolver
  let createResolver

  beforeEach(function () {
    createResolver = sinon.stub(Diminish, 'createResolver')
    isResolver = sinon.stub(Diminish, 'isResolver')
  })

  afterEach(function () {
    createResolver.restore()
    isResolver.restore()
  })

  describe('#resolve()', function () {
    it('should be an async method', async function () {
      const container = new Container()
      expect(container.resolve).to.be.a('function')
      const promise = container.resolve()
      expect(promise).to.be.instanceof(Promise)
      try { await promise } catch (error) {}
    })

    it('should return a literal', async function () {
      const container = new Container()
      container.literal('x', 1)
      const result = await container.resolve('x')
      expect(result).to.eq(1)
    })

    it('should resolve a resolver', async function () {
      const container = new Container()
      const resolver = { async resolve () { return 1 } }
      const definition = {}

      createResolver.withArgs(definition).returns(resolver)
      isResolver.withArgs(resolver).returns(true)
      container.resolver('x', definition)

      const result = await container.resolve('x')
      expect(result).to.eq(1)
    })
  })

  describe('#invoke()', function () {
    it('should be an async method', async function () {
      const container = new Container()
      expect(container.invoke).to.be.a('function')
      const promise = container.invoke()
      expect(promise).to.be.instanceof(Promise)
      try { await promise } catch (error) {}
    })

    it('should create a resolver out of a Function or Class', async function () {
      const container = new Container()
      const functionDefinition = function () {}
      const classDefinition = class {}

      let promise

      promise = container.invoke(functionDefinition)
      try { await promise } catch (error) {}
      expect(createResolver).to.have.been.calledWith(functionDefinition)

      promise = container.invoke(classDefinition)
      try { await promise } catch (error) {}
      expect(createResolver).to.have.been.calledWith(classDefinition)
    })

    it('should optionally allow a bind context as the first arg', async function () {
      const container = new Container()
      const definition = function () {}
      const resolver = { resolve: sinon.stub() }
      const context = {}

      let promise

      createResolver.withArgs(definition).returns(resolver)

      promise = container.invoke(definition)
      try { await promise } catch (error) {}
      expect(createResolver).to.have.been.calledWith(definition)
      expect(resolver.resolve).to.have.been.calledWith(container)

      createResolver.resetHistory()
      resolver.resolve.resetHistory()

      promise = container.invoke(definition, context)
      try { await promise } catch (error) {}

      expect(createResolver).to.have.been.calledWith(definition)
      expect(resolver.resolve).to.have.been.calledWith(container, context)
    })

    it('should error when nothing is given to resolve', async function () {
      const container = new Container()
      expect(container.invoke()).to.be.rejectedWith('must be a function or class')
      expect(container.invoke(1)).to.be.rejectedWith('must be a function or class')
      expect(container.invoke('x')).to.be.rejectedWith('must be a function or class')
      expect(container.invoke({})).to.be.rejectedWith('must be a function or class')
    })
  })

  describe('#resolver()', function () {
    it('should be a method', async function () {
      const container = new Container()
      expect(container.resolver).to.be.a('function')
    })

    it('should define a new resolver [string, definition]', async function () {
      const container = new Container()

      container.resolver('x', 1)
      expect(createResolver).to.have.been.calledWith(1)
      expect(container.registry.has('x')).to.be.true
    })

    it('should define a new resolver [object]', async function () {
      const container = new Container()

      container.resolver({ x: 1 })
      expect(createResolver).to.have.been.calledWith(1)
      expect(container.registry.has('x')).to.be.true
    })

    it('should prevents duplicate registration [string, definition]', async function () {
      const container = new Container()

      container.resolver('x', 1)
      expect(() => container.resolver('x', 1)).to.throw('already registered')
    })

    it('should prevents duplicate registration [object]', async function () {
      const container = new Container()

      container.resolver({ x: 1 })
      expect(() => container.resolver({ x: 1 })).to.throw('already registered')
    })

    it('should error for empty name', async function () {
      const container = new Container()

      expect(() => container.resolver('')).to.throw('must have length > 0')
    })

    it('should error for invalid parameters', async function () {
      const container = new Container()

      expect(() => container.resolver(1)).to.throw('must be a string or object')
      expect(() => container.resolver()).to.throw('must be a string or object')
      expect(() => container.resolver([])).to.throw('must be a string or object')
      expect(() => container.resolver(null)).to.throw('must be a string or object')
    })
  })

  describe('#literal()', function () {
    it('should be a method', async function () {
      const container = new Container()
      expect(container.literal).to.be.a('function')
    })

    it('should define a new literal [string, definition]', async function () {
      const container = new Container()

      container.literal('x', 1)
      expect(container.registry.get('x')).to.eq(1)
    })

    it('should define a new literal [object]', async function () {
      const container = new Container()

      container.literal({ x: 1 })
      expect(container.registry.get('x')).to.eq(1)
    })

    it('should prevents duplicate registration [string, definition]', async function () {
      const container = new Container()

      container.literal('x', 1)
      expect(() => container.literal('x', 1)).to.throw('already registered')
    })

    it('should prevents duplicate registration [object]', async function () {
      const container = new Container()

      container.literal({ x: 1 })
      expect(() => container.literal({ x: 1 })).to.throw('already registered')
    })

    it('should error for empty name', async function () {
      const container = new Container()

      expect(() => container.literal('')).to.throw('must have length > 0')
    })

    it('should error for invalid parameters', async function () {
      const container = new Container()

      expect(() => container.literal(1)).to.throw('must be a string or object')
      expect(() => container.literal()).to.throw('must be a string or object')
      expect(() => container.literal([])).to.throw('must be a string or object')
      expect(() => container.literal(null)).to.throw('must be a string or object')
    })
  })

  describe('#delete()', function () {
    it('should be a method', async function () {
      const container = new Container()
      expect(container.delete).to.be.a('function')
    })

    it('should remove a registered literal or resolver', async function () {
      const container = new Container()
      container.literal('x', 1)
      expect(container.registry.has('x')).to.be.true
      container.delete('x')
      expect(container.registry.has('x')).to.be.false
    })
  })

  describe('#has()', function () {
    it('should be a method', async function () {
      const container = new Container()
      expect(container.has).to.be.a('function')
    })

    it('should return true if name is registered', async function () {
      const container = new Container()
      container.literal('x', 1)
      expect(container.registry.has('x')).to.be.true
      expect(container.has('x')).to.be.true
      expect(container.registry.has('y')).to.be.false
      expect(container.has('y')).to.be.false
    })
  })

  describe('#reset()', function () {
    it('should be a method', async function () {
      const container = new Container()
      expect(container.reset).to.be.a('function')
    })

    it('should call reset on a resolver', async function () {
      const container = new Container()

      const resolver = { reset: sinon.stub() }

      createResolver.withArgs(1).returns(resolver)
      isResolver.withArgs(resolver).returns(true)

      container.resolver('x', 1)
      container.reset('x')

      expect(resolver.reset).to.have.been.called
    })

    it('should return true only if found and reset successfully', async function () {
      const container = new Container()

      const resolver = { reset: sinon.stub() }

      createResolver.withArgs(1).returns(resolver)
      isResolver.withArgs(resolver).returns(true)

      container.resolver('x', 1)
      container.literal('y', 2)
      expect(container.reset('x')).to.be.true // resolver
      expect(container.reset('y')).to.be.false // literal
      expect(container.reset('z')).to.be.false // undefined
    })
  })
})
