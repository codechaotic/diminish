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

describe('Registry', function () {
  let resolver : { [key in keyof Diminish.Resolver<any>] : sinon.SinonStub }
  let registry : Diminish.Registry<any>

  beforeEach(function () {
    resolver = {
      isCircular: sinon.stub(),
      resolve: sinon.stub()
    }

    registry = new Diminish.Registry()
  })

  describe('#get', function () {
    it('should be a method', function () {
      expect(registry.get).to.be.a('function')
    })

    it('should return a registered resolver', function () {
      const exposed : any = registry
      exposed._map.set('a', resolver)
      expect(registry.get('a')).to.eq(resolver)
    })
  })

  describe('#set', function () {
    it('should be a method', function () {
      expect(registry.set).to.be.a('function')
    })

    it('should register a resolver', function () {
      registry.set('a', resolver as any)
      const exposed : any = registry
      expect(exposed._map.get('a')).to.eq(resolver)
    })
  })

  describe('#has', function () {
    it('should be a method', function () {
      expect(registry.has).to.be.a('function')
    })

    it('should return true for registered keys', function () {
      const exposed : any = registry
      exposed._map.set('a', resolver)
      expect(registry.has('a')).to.be.true
    })

    it('should return false for unknown keys', function () {
      expect(registry.has('a')).to.be.false
    })
  })
})
