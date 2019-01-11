/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as Diminish from '.'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect

describe('Container', function () {
  let container : Diminish.Container
  let registry : { [key in keyof Diminish.Registry<any>] : sinon.SinonStub }
  let resolver : { [key in keyof Diminish.Resolver<any>] : sinon.SinonStub }
  let Resolver : typeof Diminish.Resolver & sinon.SinonStub
  let Registry : typeof Diminish.Registry & sinon.SinonStub

  beforeEach(function () {
    registry = {
      get: sinon.stub(),
      set: sinon.stub(),
      has: sinon.stub()
    }
    Registry = sinon.stub(Diminish, 'Registry') as any
    Registry.returns(registry)

    resolver = {
      isCircular: sinon.stub(),
      resolve: sinon.stub()
    }
    Resolver = sinon.stub(Diminish, 'Resolver') as any
    Resolver.returns(resolver)

    container = new Diminish.Container()
  })

  afterEach(function () {
    Registry.restore()
    Resolver.restore()
  })

  describe('#register', function () {
    it('should be a method', function () {
      expect(container.register).to.be.a('function')
    })

    it('should create and register a resolver [single]', function () {
      const producer = () => {}
      container.register('a', producer)
      expect(Resolver).to.have.been.calledWith(registry, 'a', producer)
      expect(registry.set).to.have.been.calledWith('a', resolver)
    })

    it('should create and register a resolver [object]', function () {
      const producer = () => {}
      container.register({ a: producer })
      expect(Resolver).to.have.been.calledWith(registry, 'a', producer)
      expect(registry.set).to.have.been.calledWith('a', resolver)
    })

    it('should error on duplicate registration', function () {
      registry.has.withArgs('a').returns(true)
      expect(() => { container.register('a', () => {}) }).to.throw('Duplicate key')
    })

    it('should error when key is invalid', function () {
      expect(() => { container.register('', () => {}) }).to.throw('Invalid Key')
      expect(() => { container.register(' ', () => {}) }).to.throw('Invalid Key')
      expect(() => { container.register('#', () => {}) }).to.throw('Invalid Key')
      expect(() => { container.register('1', () => {}) }).to.throw('Invalid Key')
    })

    it('should error on invalid call signature', function () {
      let register = container.register.bind(container) as Function
      expect(() => register()).to.throw('Expected 1 or 2 arguments')
      expect(() => register(null, null, null)).to.throw('Expected 1 or 2 arguments')
    })

    it('should error when producer has circular dependencies', function () {
      resolver.isCircular.returns(true)
      expect(() => container.register('a', () => {})).to.throw('Producer has circular dependencies')
    })
  })

  describe('#literal', function () {
    it('should be a method', function () {
      expect(container.literal).to.be.a('function')
    })

    it('should create and register a resolver [single]', function () {
      container.literal('a', true)
      expect(Resolver).to.have.been.calledWith(registry, 'a', sinon.match.func)
      expect(registry.set).to.have.been.calledWith('a', resolver)
    })

    it('should create and register a resolver [object]', function () {
      container.literal({ a: true })
      expect(Resolver).to.have.been.calledWith(registry, 'a', sinon.match.func)
      expect(registry.set).to.have.been.calledWith('a', resolver)
    })

    it('should define a trivial producer', function () {
      let producer : Function
      Resolver.callsFake((...args : any[]) => { producer = args[2] })
      container.literal('a', true)
      expect(producer).to.be.a('function')
      expect(producer()).to.eq(true)
    })

    it('should error on duplicate registration', function () {
      registry.has.withArgs('a').returns(true)
      expect(() => { container.literal('a', true) }).to.throw('Duplicate key')
    })

    it('should error when key is invalid', function () {
      expect(() => { container.literal('', true) }).to.throw('Invalid Key')
      expect(() => { container.literal(' ', true) }).to.throw('Invalid Key')
      expect(() => { container.literal('#', true) }).to.throw('Invalid Key')
      expect(() => { container.literal('1', true) }).to.throw('Invalid Key')
    })

    it('should error on invalid call signature', function () {
      let literal = container.literal.bind(container) as Function
      expect(() => literal()).to.throw('Expected 1 or 2 arguments')
      expect(() => literal(null, null, null)).to.throw('Expected 1 or 2 arguments')
    })
  })

  describe('#resolve', function () {
    it('should be a method', function () {
      expect(container.resolve).to.be.a('function')
    })

    it('should execute a resolver', function () {
      resolver.resolve.returns(true)
      registry.get.withArgs('a').returns(resolver)
      expect(container.resolve('a')).to.be.true
    })

    it('should error on unknown key', function () {
      expect(() => container.resolve('a')).to.throw('Not registered')
    })

    it('should contextualize errors thrown by the resolver', function () {
      resolver.resolve.throws(new Error('Bad'))
      registry.get.withArgs('a').returns(resolver)
      expect(() => container.resolve('a')).to.throw('Error while resolving a: Bad')
    })
  })

  describe('#invoke', function () {
    it('should be a method', function () {
      expect(container.invoke).to.be.a('function')
    })

    it('should create a resolver', function () {
      const producer = () => true
      container.invoke(producer)
      expect(Resolver).to.have.been.calledWith(registry, '#', producer)
      expect(registry.set).not.to.have.been.called
    })

    it('should execute resolver [sync]', function () {
      resolver.resolve.returns(true)
      const value = container.invoke(() => {})
      expect(value).to.be.true
    })

    it('should execute resolver [async]', async function () {
      resolver.resolve.resolves(true)
      const value = await container.invoke(async () => {})
      expect(value).to.be.true
    })

    it('should execute resolver with a custom context', function () {
      resolver.resolve.resolves(true)
      const context = {}
      container.invoke(context,  () => {})
      expect(resolver.resolve).to.have.been.calledWith(context)
    })

    it('should error on invalid call signature', function () {
      let invoke = container.invoke.bind(container) as Function
      expect(() => invoke()).to.throw('Expected 1 or 2 arguments')
      expect(() => invoke(null)).to.throw('Expected arg 1 to be a function or class')
      expect(() => invoke(null, null)).to.throw('Expected arg 2 to be a function or class')
      expect(() => invoke(null, null, null)).to.throw('Expected 1 or 2 arguments')
    })
  })
})
