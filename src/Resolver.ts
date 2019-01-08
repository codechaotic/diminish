import * as assert from 'assert'
import {
  Factory,
  AsyncFactory,
  Constructor,
  Producer,
  ProducerType,
  Registry,
  parse
} from '.'

export type ResolverObject < ITypes > = {
  [Key in keyof ITypes] : Resolver<ITypes[Key]>
}

export class Resolver<Result> {
  private _reg: Registry<any>
  private _type: ProducerType
  private _args: Array<string | Array<string>>
  private _name: string
  private _fn : Producer<Result>
  private _ready : boolean
  private _promise : Promise<Result>
  private _value : Result

  private _apply (context, params: any[]) {
    switch (this._type) {
      case 'class':
        const Class = Function.prototype.bind.apply(this._fn, [null].concat(params)) as Constructor<Result>
        return new Class()
      case 'function':
      case 'arrow':
        const Factory = this._fn as Factory<Result> | AsyncFactory<Result>
        return Factory.apply(context, params)
      default: throw Error('Unknown type')
    }
  }

  private _resolve (context = null) : Result | Promise<Result> {
    const params = [] as Array<any>
    const promises = [] as Array<Promise<any>>

    for (const arg of this._args) {
      if (Array.isArray(arg)) {
        const keys = arg
        const obj = {} as { [x:string]: any }
        const promises = [] as Array<Promise<any>>

        for (const key of keys) {
          const resolver = this._reg.get(key)
          assert(resolver, `'${key}' is not registered`)
          obj[key] = resolver.resolve()
        }

        for (const key of keys) {
          if (obj[key] instanceof Promise) {
            promises.push(obj[key].then(value => obj[key] = value))
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
        promises.push(params[i].then(result => {
          return params.splice(i, 1, result)
        }))
      }
    }

    if (promises.length === 0) return this._apply(context, params)
    else return Promise.all(promises).then(() => this._apply(context, params))
  }

  constructor (registry: Registry<any>, name: string, fn: Producer<Result>) {
    const { type, args } = parse(fn)
    this._type = type
    this._args = args
    this._reg = registry
    this._name = name
    this._fn = fn
    this._ready = false
  }

  public isCircular (path: Array<string> = []) : boolean {
    if (path.includes(this._name)) return true

    let deps : Array<string> = []
    for (const arg of this._args) {
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

  public resolve (context = null) : Result | Promise<Result> {
    if (this.isCircular()) {
      throw new Error(`has circular dependencies`)
    }

    if (this._ready) return this._value
    else if (this._promise) return this._promise
    else {
      const result = this._resolve(context)

      if (result instanceof Promise) {
        this._promise = result.then(
          value => {
            this._value = value
            delete this._promise
            return value
          }
        )
      } else {
        this._value = result
      }

      return result
    }
  }
}
