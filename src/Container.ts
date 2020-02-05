/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */

import * as path from 'path'
import * as glob from 'glob'
import { Producer, Resolver, Registry } from '.'

const KEY_REGEX = /[a-zA-Z_$][0-9a-zA-Z_$]*/

export type ProducerObject < ITypes > = {
  [Key in keyof ITypes]: Producer<ITypes[Key]>
}

export type LiteralObject < ITypes > = {
  [Key in keyof ITypes]: ITypes[Key]
}

export type ResolverObject < ITypes > = {
  [Key in keyof ITypes]: Resolver<ITypes[Key]>
}

export type ImportLoader = (container: Container, module: any) => void
export type ImportOptions = {
  include?: string | string[]
  exclude?: string | string[]
  cwd?: string
  loader?: ImportLoader
}

/* istanbul ignore next */
// Ignore these rows when calculating coverage. This is used to allow mocking
// the import and glob functions in tests.
export const Module = {
  load: (module: string) => import(module),
  find: (pattern: string, options: glob.IOptions) => {
    return new Promise<string[]>((resolve, reject) => {
      glob(pattern, options, (err, matches) => {
        err ? reject(err) : resolve(matches)
      })
    })
  }
}

export const DefaultImportOptions: ImportOptions = {
  include: [],
  exclude: [],
  cwd: process.cwd(),
  loader: (container: Container, module: any) => {
    container.register(module)
  }
}

export class Container<ITypes = any> {
  private _registry = new Registry<ITypes>()

  public register (obj: Partial<ProducerObject<ITypes>>): void
  public register<Key extends keyof ITypes> (key: Key, producer: Producer<ITypes[Key]>): void
  public register (...args: any[]): void {
    let obj: Partial<ProducerObject<ITypes>>

    switch (args.length) {
      case 1: obj = args[0]; break
      case 2: obj = { [args[0]]: args[1] } as Partial<ProducerObject<ITypes>>; break
      default: throw new Error(`Expected 1 or 2 arguments. Got ${args.length}`)
    }

    const resolvers = {} as ResolverObject<ITypes>

    for (const key in obj) {
      const producer = obj[key] as any
      if (!KEY_REGEX.test(key as string)) {
        throw new Error(`Error while registering key '${key}': Invalid Key`)
      }

      if (this._registry.has(key)) {
        throw new Error(`Error while registering key '${key}': Duplicate key`)
      }

      resolvers[key] = new Resolver<any>(this._registry, key as string, producer)

      if (resolvers[key].isCircular()) {
        throw new Error(`Error while registering key '${key}': Producer has circular dependencies`)
      }
    }

    for (const key in resolvers) {
      this._registry.set(key, resolvers[key])
    }
  }

  public literal (obj: Partial<LiteralObject<ITypes>>): void
  public literal<Key extends keyof ITypes> (key: Key, value: ITypes[Key]): void
  public literal (...args: any[]): void {
    let obj: Partial<LiteralObject<ITypes>>

    switch (args.length) {
      case 1: obj = args[0]; break
      case 2: obj = { [args[0]]: args[1] } as Partial<LiteralObject<ITypes>>; break
      default: throw new Error(`Expected 1 or 2 arguments. Got ${args.length}`)
    }

    for (const key in obj) {
      if (!KEY_REGEX.test(key as string)) {
        throw new Error(`Error while registering key '${key}': Invalid Key`)
      }

      if (this._registry.has(key)) {
        throw new Error(`Error while registering key '${key}': Duplicate key`)
      }

      const producer: Producer<any> = () => obj[key]
      const resolver = new Resolver<any>(this._registry, key as string, producer)
      this._registry.set(key, resolver)
    }
  }

  public resolve<Key extends keyof ITypes> (key: Key): ITypes[Key] | Promise<ITypes[Key]> {
    const resolver = this._registry.get<Key>(key)

    if (!resolver) {
      throw new Error(`Error while resolving ${key}: Not registered`)
    }

    try {
      return resolver.resolve(null)
    } catch (error) {
      throw new Error(`Error while resolving ${key}: ${error.message}`)
    }
  }

  public invoke<Result> (fn: Producer<Result>): Result | Promise<Result>
  public invoke<Result> (context: any, fn: Producer<Result>): Result | Promise<Result>
  public invoke<Result> (...args: any[]): Result | Promise<Result> {
    let fn: any
    let context: any = null

    switch (args.length) {
      case 1: [fn] = args; break
      case 2: [context, fn] = args; break
      default: throw new Error(`Expected 1 or 2 arguments. Got ${args.length}`)
    }

    if (typeof fn !== 'function') {
      throw new Error(`Expected arg ${args.length} to be a function or class`)
    }

    const resolver = new Resolver<Result>(this._registry, '#', fn)
    return resolver.resolve(context)
  }

  public async import (pattern: string | string[], options?: ImportOptions): Promise<void>
  public async import (options: ImportOptions): Promise<void>
  public async import (...args: any[]): Promise<void> {
    const options = {} as ImportOptions
    const defaults = DefaultImportOptions

    switch (args.length) {
      case 1:
        if (typeof args[0] === 'string') options.include = [args[0]]
        else if (Array.isArray(args[0])) options.include = args[0]
        else if (args[0] && args[0] instanceof Object) Object.assign(options, args[0])
        else throw new Error('Requires either a pattern, array of patterns, or options object')
        break
      case 2:
        if (typeof args[0] === 'string') options.include = [args[0]]
        else if (Array.isArray(args[0])) options.include = args[0]
        else throw new Error('First argument must be a pattern or array of patterns')

        if (args[1] && args[1] instanceof Object) Object.assign(options, args[1])
        else throw new Error('Second argument must be an options object')
        break
      default: throw new Error(`Expected 1 or 2 arguments. Got ${args.length}`)
    }

    const include = ([] as any[]).concat(options?.include ?? defaults.include)
    const ignore = ([] as any[]).concat(options?.exclude ?? defaults.exclude)
    const loader: any = options.loader || defaults.loader
    const cwd: any = options.cwd || defaults.cwd

    if (include.length === 0) {
      throw new Error('Must provide at least one include pattern')
    }

    if (include.some(pattern => typeof pattern !== 'string')) {
      throw new Error('Patterns must be strings')
    }

    const files: any[] = []
    for (const pattern of include) {
      const matches = await Module.find(pattern, { cwd, ignore, nodir: true })
      for (const match of matches) files.push(path.resolve(cwd, match))
    }

    for (const file of files) {
      try {
        const module = await Module.load(file)
        await loader(this, module)
      } catch (error) {
        throw new Error(`Failed to load module ${file}: ${error.message}`)
      }
    }
  }

  public isRegistered <Key extends keyof ITypes> (key: Key) {
    if (!KEY_REGEX.test(key as string)) {
      throw new Error(`Error while checking key '${key}': Invalid Key`)
    }

    return this._registry.has(key)
  }
}
