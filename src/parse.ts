/* eslint-disable no-unused-vars */

import { parseScript } from 'esprima'
import * as assert from 'assert'

const NATIVE_REGEXP = /\{\s*\[native code\]\s*\}/

// Extract argument names from a function. The result is a mixed array.
// Items in the result can be a string, representing an identifier name, or
// an array of strings, representing identifier names to attach to an object.
// i.e. if fn = (a, { b }) => {}, extractArgs(fn) -> ['a', ['b']]
export function parse (fn: Function) : { type: 'class'|'function'|'arrow', args: Array<string|Array<string>> } {
  assert(fn instanceof Function, 'Must be a function or class')
  assert(!NATIVE_REGEXP.test('' + fn), 'Cannot extract from a native function')

  const declaration = parseDeclaration(fn)

  let target = null
  let type = null
  switch (declaration.type) {
    case 'ClassExpression':
      type = 'class'
      for (let f = fn; f instanceof Function; f = Object.getPrototypeOf(f)) {
        const declaration = parseDeclaration(f)
        const result = parseClassConstructor(declaration)
        if (result !== null) {
          target = result
          break
        }
      }
      break
    case 'FunctionExpression':
      type = 'function'
      target = declaration
      break
    case 'ArrowFunctionExpression':
      type = 'arrow'
      target = declaration
      break
  }

  let args : any
  if (target !== null) args = parseFunctionArgs(target)
  else args = []

  return { type, args }
}

export function parseDeclaration (fn : Function) {
  assert(fn instanceof Function, 'Must be a function')

  let script : any

  // Parsing fn.toString() directly fails for anonymous function definitions.
  // Wrapping it in a pointless assignment ensures it's always parsable
  try { script = parseScript('fn=' + fn) } catch (error) {}

  // That can still fail when the function is defined directly on an object,
  // such as { fn() {} }. In this case, the function token needs to be
  // inserted before it's parseable on its own.
  if (!script) try { script = parseScript('fn=function ' + fn) } catch (error) {}

  // That covers all currently known cases, so anything else should be an error
  // If new cases are found, insert them here somewhere.
  assert(script, 'Failed to parse declaration function')

  // Extract the function declaration from the assignment
  const expression = script.body[0].expression
  return expression.right
}

export function parseFunctionArgs (expression: any) {
  let args = []
  for (const param of expression.params) {
    switch (param.type) {
      case 'Identifier':
        args.push(param.name)
        break
      case 'ObjectPattern':
        let properties = []
        for (const property of param.properties) {
          properties.push(property.key.name)
        }
        args.push(properties)
        break
    }
  }
  return args
}

export function parseClassConstructor (expression: any) {
  const { body } = expression.body
  let classConstructor = null
  for (let definition of body) {
    if (definition.type === 'MethodDefinition' && definition.key.name === 'constructor') {
      classConstructor = definition.value
      break
    }
  }
  return classConstructor
}