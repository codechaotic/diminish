export type Keys < ITypes > = keyof ITypes
export type Values < ITypes > = ITypes[Keys<ITypes>]
export type Constructor < Result > = new (...args: any[]) => Result
export type Factory < Result > = (...args: any[]) => Result
export type AsyncFactory < Result > = (...args: any[]) => Promise<Result>
export type Producer < Result > = Constructor<Result> | Factory<Result> | AsyncFactory<Result>
export type ProducerObject < ITypes > = {
  [Key in keyof ITypes] : Producer<ITypes[Key]>
}
export type ProducerType = 'class'|'function'|'arrow'
export type LiteralObject < ITypes > = {
  [Key in keyof ITypes] : any
}
