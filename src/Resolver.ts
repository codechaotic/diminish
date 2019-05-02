/* eslint-disable no-unused-vars */

import * as assert from 'assert'
import { Registry, FunctionInfo, parse } from '.'

export type Constructor < Result > = new (...args: any[]) => Result
export type Factory < Result > = (...args: any[]) => Result
export type AsyncFactory < Result > = (...args: any[]) => Promise<Result>
export type Producer < Result > = Constructor<Result> | Factory<Result> | AsyncFactory<Result>

export class Resolver<Result = any> {
  private _reg: Registry<any>
  private _info: FunctionInfo
  private _name: string
  private _fn: Producer<Result>
  private _ready: boolean
  private _promise: Promise<Result>
  private _value: Result

  private _apply (context: any, params: any[]) {
    switch (this._info.type) {
      case 'class':
        assert(context === null, 'constructor cannot be called with custom context')
        const Class = Function.prototype.bind.apply(this._fn, [null].concat(params)) as Constructor<Result>
        return new Class()
      case 'arrow':
        assert(context === null, 'arrow function cannot be called with custom context')
        /* falls through */
      case 'function':
        const Factory = this._fn as Factory<Result> | AsyncFactory<Result>
        return Factory.apply(context, params)
    }
  }

  private _resolve (context = null): Result | Promise<Result> {
    const params = [] as Array<any>
    const promises = [] as Array<Promise<any>>

    for (const arg of this._info.args) {
      if (Array.isArray(arg)) {
        const keys = arg
        const obj = {} as { [x: string]: any }
        const promises = [] as Array<Promise<any>>

        for (const key of keys) {
          const resolver = this._reg.get(key)
          assert(resolver, `'${key}' is not registered`)
          obj[key] = resolver.resolve()
        }

        for (const key of keys) {
          if (obj[key] instanceof Promise) {
            promises.push(obj[key].then((value: any) => (obj[key] = value)))
          }
        }

        if (promises.length === 0) params.push(obj)
        else params.push(Promise.all(promises).then(() => obj))
      } else {
        const resolver = this._reg.get(arg)
        assert(resolver, `'${arg}' is not registered`)
        params.push(resolver.resolve())
      }
    }

    for (let i = 0; i < params.length; i++) {
      if (params[i] instanceof Promise) {
        promises.push(params[i].then((result: any) => {
          return params.splice(i, 1, result)
        }))
      }
    }

    if (promises.length === 0) return this._apply(context, params)
    else return Promise.all(promises).then(() => this._apply(context, params))
  }

  constructor (registry: Registry<any>, name: string, fn: Producer<Result>) {
    this._info = parse(fn)
    this._reg = registry
    this._name = name
    this._fn = fn
    this._ready = false
    this._value = null
    this._promise = null
  }

  public isCircular (path: Array<string> = []): boolean {
    if (path.includes(this._name)) return true

    let deps: string[] = []
    for (const arg of this._info.args) {
      deps = deps.concat(arg)
    }

    let uniq = [] as Array<string>
    for (const arg of deps) {
      if (!uniq.includes(arg)) uniq.push(arg)
    }

    const currentPath = path.concat(this._name)

    for (const node of currentPath) {
      if (uniq.includes(node)) return true
    }

    for (const arg of uniq) {
      const resolver = this._reg.get(arg)
      if (resolver && resolver.isCircular(currentPath)) return true
    }

    return false
  }

  public resolve (context = null): Result | Promise<Result> {
    if (this.isCircular()) {
      throw new Error(`has circular dependencies`)
    }

    if (this._ready) {
      return this._value
    } else if (this._promise) {
      return this._promise
    } else {
      const result = this._resolve(context)
      if (result instanceof Promise) {
        this._promise = result.then(
          value => {
            this._ready = true
            this._value = value
            return value
          }
        )

        return this._promise
      } else {
        this._ready = true
        this._value = result

        return this._value
      }
    }
  }
}
