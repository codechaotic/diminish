/* eslint-disable no-unused-vars */

import { parseScript } from 'esprima'
import * as Diminish from '.'
import * as assert from 'assert'

export type FunctionType = 'class' | 'function' | 'arrow'
export type FunctionArgs = Array<string | string[]>
export type FunctionInfo = {
  type: FunctionType,
  args: FunctionArgs
}

const NATIVE_REGEXP = /\{\s*\[native code\]\s*\}/

// Extract argument names from a function. The result is a mixed array.
// Items in the result can be a string, representing an identifier name, or
// an array of strings, representing identifier names to attach to an object.
// i.e. if fn = (a, { b }) => {}, extractArgs(fn) -> ['a', ['b']]
export function parse (fn: Function): FunctionInfo {
  assert(fn instanceof Function, 'Must be a function or class')
  assert(!NATIVE_REGEXP.test('' + fn), 'Cannot parse a native function')

  const expression = Diminish.getExpression(fn)

  let type: any
  let args: any
  switch (expression.type) {
    case 'ClassExpression':
      type = 'class'
      args = Diminish.getArgs(Diminish.getConstructorExpression(fn))
      break
    case 'FunctionExpression':
      type = 'function'
      args = Diminish.getArgs(expression)
      break
    case 'ArrowFunctionExpression':
      type = 'arrow'
      args = Diminish.getArgs(expression)
      break
  }

  return { type, args }
}

export function getExpression (fn: Function) {
  let program

  // Parsing fn.toString() directly fails for anonymous function definitions.
  // Wrapping it in a pointless assignment ensures it's always parsable
  try { program = parseScript('fn=' + fn) } catch (error) { /* ignore */ }

  // That can still fail when the function is defined directly on an object,
  // such as { fn() {} }. In this case, the function token needs to be
  // inserted before it's parseable on its own.
  if (!program) try { program = parseScript('fn=function ' + fn) } catch (error) { /* ignore */ }

  // That covers all currently known cases, so anything else should be an error
  // If new cases are found, insert them here somewhere.
  assert(program, 'Failed to parse declaration function')

  // Extract the function declaration from the assignment
  const body = program.body

  const first = body[0]
  const expression = first.expression

  const func = expression.right
  if (func.type !== 'FunctionExpression') {
    if (func.type !== 'ArrowFunctionExpression') {
      if (func.type !== 'ClassExpression') {
        throw new Error('Assignment Value Not a Function or Class')
      }
    }
  }

  return func
}

export function getConstructorExpression (constructor: Function)
export function getConstructorExpression (constructor: any) {
  if (typeof constructor !== 'function') {
    throw new Error('Not a Function')
  }

  for (let fn = constructor; fn instanceof Function; fn = Object.getPrototypeOf(fn)) {
    const expression = Diminish.getExpression(fn)
    if (expression.type !== 'ClassExpression') {
      throw new Error('Not a ClassExpression')
    }

    const classBody = expression.body
    const definitions = classBody.body
    for (let definition of definitions) {
      const key = definition.key
      if (key.name === 'constructor') {
        return definition.value
      }
    }
  }

  return null
}

export function getArgs (expression: any) {
  let args: FunctionArgs = []
  if (expression) {
    for (const param of expression.params) {
      switch (param.type) {
        case 'Identifier':
          args.push(param.name)
          break
        case 'ObjectPattern':
          let keys: string[] = []
          for (const property of param.properties) {
            const key = property.key
            keys.push(key.name)
          }
          args.push(keys)
          break
      }
    }
  }
  return args
}
