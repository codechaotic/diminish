/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'

import { parse } from './parse'

chai.use(chaiAsPromised)

const expect = chai.expect

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
    const d0 = function (a:any) { a }
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should parse args from arrow functions', async function () {
    const d0 = (a:any) => { a }
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should parse args from object property method', async function () {
    const o = { d0 (a:any) { a } }
    expect(parse(o.d0).args).to.deep.equal(['a'])
  })

  it('should parse args from class constructor', async function () {
    const d0 = class { a: any; constructor (a:any) { this.a = a } }
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should ignore non-constructor methods on class', async function () {
    const d0 = class { method () {} }
    expect(parse(d0).args).to.deep.equal([])
  })

  it('should recursively use parent class constructor', async function () {
    const p0 = class { a: any; constructor (a:any) { this.a = a } }
    const p1 = class extends p0 {}
    const d0 = class extends p1 {}
    expect(parse(d0).args).to.deep.equal(['a'])
  })

  it('should parse dereferenced args from functions', async function () {
    const d0 = function ({ a } : any) { a }
    const d1 = function ({ a: x } : any) { x }
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })

  it('should parse args from arrow functions', async function () {
    const d0 = ({ a } : any) => { a }
    const d1 = ({ a: x } : any) => { x }
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })

  it('should parse args from class constructor', async function () {
    const d0 = class { a: any; constructor ({ a } : any) { this.a = a } }
    const d1 = class { x: any; constructor ({ a: x } : any) { this.x = x } }
    expect(parse(d0).args).to.deep.equal([['a']])
    expect(parse(d1).args).to.deep.equal([['a']])
  })

  it('should error on unrecognized expression', async function () {
    const d0 = {} as any
    expect(() => parse(d0)).to.throw('Must be a function or class')
  })
})
