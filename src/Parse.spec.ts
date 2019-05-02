/* tslint:disable:no-unused-expression no-empty */

import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as Diminish from '.'
import * as esprima from 'esprima'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect

describe('Parse', function () {
  describe('getExpression', function () {
    it('should be a function', function () {
      expect(Diminish.getExpression).to.be.a('function')
    })

    it('should process an anonymous class', function () {
      const result = Diminish.getExpression(class {})
      expect(result.type).to.eq('ClassExpression')
    })

    it('should process a named class', function () {
      const result = Diminish.getExpression(class C {})
      expect(result.type).to.eq('ClassExpression')
    })

    it('should process an arrow function', function () {
      const result = Diminish.getExpression(() => {})
      expect(result.type).to.eq('ArrowFunctionExpression')
    })

    it('should process an anonymous function', function () {
      const result = Diminish.getExpression(function () {})
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should process a named function', function () {
      const result = Diminish.getExpression(function f () {})
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should process dictionary property functions', function () {
      const obj = { fn () {} }
      const result = Diminish.getExpression(obj.fn)
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should error on non-function rhs from esprima', function () {
      const parseScript = sinon.stub(esprima, 'parseScript')
      parseScript.returns({
        type: 'Program',
        body: [{
          type: 'ExpressionStatement',
          expression: {
            type: 'AssignmentExpression',
            operator: '=',
            left: { type: 'Identifier', name: 'fn' },
            right: { type: 'Literal', value: 1 }
          }
        }],
        sourceType: 'script'
      })
      expect(() => Diminish.parse(() => {})).to.throw('Not a Function or Class')
      parseScript.restore()
    })
  })

  describe('getConstructorExpression', function () {
    it('should be a function', function () {
      expect(Diminish.getConstructorExpression).to.be.a('function')
    })

    it('should return null with no constructor defined', function () {
      const result = Diminish.getConstructorExpression(class {})
      expect(result).to.be.null
    })

    it('should return the constructor FunctionExpression', function () {
      const Class = class { constructor () { '' } }
      const result = Diminish.getConstructorExpression(Class)
      expect(result).not.to.be.null
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should return the parent constructor FunctionExpression', function () {
      const Parent = class { constructor () { '' } }
      const Class = class extends Parent {}
      const result = Diminish.getConstructorExpression(Class)
      expect(result).not.to.be.null
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should return the grandparent constructor FunctionExpression', function () {
      const Grandparent = class { constructor () { '' } }
      const Parent = class extends Grandparent {}
      const Class = class extends Parent {}
      const result = Diminish.getConstructorExpression(Class)
      expect(result).not.to.be.null
      expect(result.type).to.eq('FunctionExpression')
    })

    it('should ignore the parent constructor if constructor defined', function () {
      const Parent = class { constructor () { '' } }
      const Class = class extends Parent { constructor (a: any) { super(); a } }
      const result = Diminish.getConstructorExpression(Class)
      expect(result).not.to.be.null
      expect(result.type).to.eq('FunctionExpression')
      expect(result.params).to.have.length(1)
    })

    it('should error on non-function', function () {
      expect(() => Diminish.getConstructorExpression(null)).to.throw('Not a Function')
    })

    it('should error on non-class', function () {
      const getExpression = sinon.stub(Diminish, 'getExpression')
      getExpression.returns({
        type: 'FunctionExpression',
        params: [],
        body: { type: 'BlockStatement', body: [] }
      })
      expect(() => Diminish.getConstructorExpression(() => {})).to.throw('Not a ClassExpression')
      getExpression.restore()
    })

    it('should ignore non-constructor methods', function () {
      const getExpression = sinon.stub(Diminish, 'getExpression')
      getExpression.returns({
        type: 'ClassExpression',
        body: {
          type: 'ClassBody',
          body: [{
            type: 'MethodDefinition',
            key: { type: 'Identifier', name: 'method' },
            computed: false,
            value: {
              type: 'FunctionExpression',
              params: [],
              body: { type: 'BlockStatement', body: [] }
            },
            kind: 'method',
            static: false
          }]
        }
      })
      const result = Diminish.getConstructorExpression(class {})
      expect(result).to.be.null
      getExpression.restore()
    })
  })

  describe('getArgs', function () {
    it('should be a function', function () {
      expect(Diminish.getArgs).to.be.a('function')
    })

    it('should return an empty array with no args', function () {
      const result = Diminish.getArgs({
        type: 'FunctionExpression',
        params: [],
        body: { type: 'BlockStatement', body: [] }
      })
      expect(result).to.be.empty
    })

    it('should return standard argument names', function () {
      const result = Diminish.getArgs({
        type: 'FunctionExpression',
        params: [{
          type: 'Identifier',
          name: 'a'
        }],
        body: { type: 'BlockStatement', body: [] }
      })
      expect(result).to.deep.eq(['a'])
    })

    it('should return destructured argument names', function () {
      const result = Diminish.getArgs({
        type: 'FunctionExpression',
        params: [{
          type: 'ObjectPattern',
          properties: [{
            type: 'Property',
            key: { type: 'Identifier', name: 'a' },
            value: { type: 'Identifier', name: 'a' },
            kind: 'init',
            method: false,
            shorthand: true,
            computed: false
          }]
        }],
        body: { type: 'BlockStatement', body: [] }
      })
      expect(result).to.deep.eq([['a']])
    })
  })

  describe('parse', function () {
    it('should be a function', function () {
      expect(Diminish.parse).to.be.a('function')
    })

    it('should return type "arrow" for arrow functions', function () {
      const getExpression = sinon.stub(Diminish, 'getExpression')
      const getArgs = sinon.stub(Diminish, 'getArgs')

      getExpression.returns({
        type: 'ArrowFunctionExpression',
        params: [],
        expression: false,
        body: { type: 'BlockStatement', body: [] }
      })

      const result = Diminish.parse(() => {})
      expect(result.type).to.eq('arrow')

      getArgs.restore()
      getExpression.restore()
    })

    it('should return type "arrow" for standard functions', function () {
      const getExpression = sinon.stub(Diminish, 'getExpression')
      const getArgs = sinon.stub(Diminish, 'getArgs')

      getExpression.returns({
        type: 'FunctionExpression',
        params: [],
        body: { type: 'BlockStatement', body: [] }
      })

      const result = Diminish.parse(function () {})
      expect(result.type).to.eq('function')

      getArgs.restore()
      getExpression.restore()
    })

    it('should return type "class" for class constructors', function () {
      const getExpression = sinon.stub(Diminish, 'getExpression')
      const getConstructorExpression = sinon.stub(Diminish, 'getConstructorExpression')
      const getArgs = sinon.stub(Diminish, 'getArgs')

      getExpression.returns({
        type: 'ClassExpression',
        id: { type: 'Identifier', name: 'x' },
        superClass: null,
        body: { type: 'ClassBody', body: [] }
      })

      getConstructorExpression.returns(null)

      const result = Diminish.parse(class {})
      expect(result.type).to.eq('class')

      getArgs.restore()
      getConstructorExpression.restore()
      getExpression.restore()
    })

    it('should return an empty array for falsey values', function () {
      const result = Diminish.getArgs(null)
      expect(result).deep.eq([])
    })
  })
})
