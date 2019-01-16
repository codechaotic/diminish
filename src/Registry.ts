import { Resolver } from '.'

export class Registry<ITypes> {
  private _map = new Map<keyof ITypes, Resolver<ITypes[keyof ITypes]>>()

  public get <Key extends keyof ITypes> (key: Key) {
    return this._map.get(key) as Resolver<ITypes[Key]>
  }

  public set <Key extends keyof ITypes> (key: Key, resolver: Resolver<ITypes[Key]>) {
    this._map.set(key, resolver)
  }

  public has <Key extends keyof ITypes> (key: Key) {
    return this._map.has(key)
  }
}
