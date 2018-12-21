/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const expect = require('chai').expect
const chai = require('chai')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const parse = require('./parse')

describe('parse', function () {
  it('should parse functions with type "function"', async function () {
    const d0 = function () {}
    expect(parse(d0).type).to.equal('function')
  })

  it('should parse arrow functions with type "arrow"', async function () {
    const d0 = () => {}
    expect(parse(d0).type).to.equal('arrow')
  })

  it('should parse classes with type "class"', async function () {
    const d0 = class {}
    expect(parse(d0).type).to.equal('class')
  })

  it('should parse args from functions', async function () {
    const d0 = function (a) {}
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should parse args from arrow functions', async function () {
    const d0 = (a) => {}
    const d1 = a => {}
    expect(parse(d0).args).to.deep.equal(['a'])
    expect(parse(d1).args).to.deep.equal(['a'])
  })

  it('should parse args from class constructor', async function () {
    const d0 = class { constructor (a) { this.a = a } }
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should recursively use parent class constructor', async function () {
    const p0 = class { constructor (a) { this.a = a } }
    const p1 = class extends p0 {}
    const d0 = class extends p1 {}
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should parse dereferenced args from functions', async function () {
    const d0 = function ({ a }) {}
    const d1 = function ({ a: x }) {}
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })

  it('should parse args from arrow functions', async function () {
    const d0 = ({ a }) => {}
    const d1 = ({ a: x }) => {}
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })

  it('should parse args from class constructor', async function () {
    const d0 = class { constructor ({ a }) { this.a = a } }
    const d1 = class { constructor ({ a: x }) { this.x = x } }
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })
})
