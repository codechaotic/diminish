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

describe('Resolver', function () {
  let parse : typeof Diminish.parse
  let resolver : Diminish.Resolver
  let registry : { [key in keyof Diminish.Registry<any>] : sinon.SinonStub }
  let Registry : typeof Diminish.Registry & sinon.SinonStub

  beforeEach(function () {
    registry = {
      get: sinon.stub(),
      set: sinon.stub(),
      has: sinon.stub()
    }
    Registry = sinon.stub(Diminish, 'Registry') as any
    Registry.returns(registry)
  })

  afterEach(function () {
    Registry.restore()
  })

  describe('#_apply', function () {

  })

  describe('#_resolve', function () {

  })

  describe('#resolve', function () {

  })

  describe('#isCircular', function () {

  })
  // describe('#resolve', function () {
  //   it('should be an async method', async function () {
  //     const type = 'function'
  //     const args = []
  //     const fn = sinon.stub()
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     const resolver = new Resolver(fn)
  //
  //     expect(resolver.resolve).to.be.a('function')
  //     const promise = resolver.resolve()
  //     expect(promise).to.be.instanceof(Promise)
  //     await promise
  //   })
  //
  //   it('should resolve against the provided container', async function () {
  //     const type = 'function'
  //     const args = ['a']
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     container.resolve.withArgs('a').resolves(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.calledWith(0xA)
  //   })
  //
  //   it('should get value for functions by executing them', async function () {
  //     const type = 'function'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     fn.returns(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     expect(await resolver.resolve(container)).to.eq(0xA)
  //   })
  //
  //   it('should get value for arrow functinos by executing them', async function () {
  //     const type = 'arrow'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     fn.returns(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     expect(await resolver.resolve(container)).to.eq(0xA)
  //   })
  //
  //   it('should get value for classes by instantiating them', async function () {
  //     const type = 'class'
  //     const args = []
  //     const construct = sinon.stub()
  //     const Class = class { constructor () { construct() } }
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //
  //     const resolver = new Resolver(Class)
  //
  //     expect(await resolver.resolve(container)).to.deep.equal({})
  //     expect(construct).to.have.been.called
  //   })
  //
  //   it('should bind a context to a function if provided', async function () {
  //     const type = 'function'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //     const context = {}
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container, context)
  //     expect(fn).to.have.been.calledOn(context)
  //   })
  //
  //   it('should error when context is provided to arrow function', async function () {
  //     const type = 'arrow'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //     const context = {}
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     fn.returns(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     const promise = resolver.resolve(container, context)
  //     expect(promise).to.be.rejectedWith('Cannot apply custom context')
  //   })
  //
  //   it('should error with an unknown type', async function () {
  //     const type = 'unknown'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //
  //     const resolver = new Resolver(fn)
  //
  //     const promise = resolver.resolve(container, context)
  //     expect(promise).to.be.rejectedWith('Unknown type')
  //   })
  //
  //   it('should reconstruct dereferenced parameters', async function () {
  //     const type = 'function'
  //     const args = [['a']]
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     container.resolve.withArgs('a').resolves(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.calledWith({ a: 0xA })
  //   })
  //
  //   it('should resolve async dependencies', async function () {
  //     const type = 'function'
  //     const args = ['a']
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //     container.resolve.withArgs('a').resolves(0xA)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.calledWith(0xA)
  //   })
  //
  //   it('should cache the resolved value', async function () {
  //     const type = 'function'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.called
  //     fn.resetHistory()
  //     await resolver.resolve(container)
  //     expect(fn).not.to.have.been.called
  //   })
  // })

  // describe('#reset', function () {
  //   it('should clear the internal cache', async function () {
  //     const type = 'function'
  //     const args = []
  //     const fn = sinon.stub()
  //     const container = { resolve: sinon.stub() }
  //
  //     parse.returns({ type, args })
  //     isContainer.returns(true)
  //
  //     const resolver = new Resolver(fn)
  //
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.called
  //     fn.resetHistory()
  //     resolver.reset()
  //     await resolver.resolve(container)
  //     expect(fn).to.have.been.called
  //   })
  // })
})
