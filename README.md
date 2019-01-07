## Diminish <small>Minimal Dependency Injection</small>

### Getting Started

Install the package with npm as follows

```
npm install --save diminish
```

Now create a container by importing the provided `Container` class.

```ts
import { Container } from 'diminish'

const container = new Container()
```

### Providers

Diminish works by defining providers using the `register` method. Once defined,
the `resolve` method can be used to execute the provider.

```ts
container.register('itemOne', () => {
  return 1
})

const itemOne = container.resolve('itemOne')
//--> itemOne === 1
```

Dependencies can be injected into a provider by passing them as arguments. This
works using standard function arguments *or* destructured arguments. When the provider is resolved, each of the dependencies will be resolved first.

```ts
// Destructured Arguments
container.register('itemTwo', ({ itemOne }) => {
  return 1 + itemOne
})

// Standard Arguments
container.register('itemTwo', (itemOne) => {
  return 1 + itemOne
})

const itemTwo = container.resolve('itemTwo')
//--> itemTwo === 2
```

### Async Providers
Asynchronous providers are transparently supported using the same interface.
When a provider is asynchronous, the `resolve` method will return a promise
which can be awaited.

```ts
container.register('itemOne', async () => {
  return 1
})

const promise = container.resolve('itemOne')
//--> promise = Promise(<Pending>)
```

Even if a provider is not asynchronous, if any of its
dependencies are provided asynchronously the `resolve` method will still
return a promise. For this reasons, unless you are certain that resolution
doesn't involve any asynchronous operations, it is good practice to `await`
calls to `resolve`.

```ts
// itemOne is an asynchronous provider
container.register('itemTwo', ({ itemOne }) => {
  return 1
})

const promise = container.resolve('itemTwo')
//--> promise = Promise(<Pending>)
```

### Class Providers

It is also possible to provide a class constructor as the provider. When
resolved, the class will be called with the `new` keyword and the returned
instance will become the resolved value. Dependencies are injected according
to the properties on the class constructor.

```ts
container.register('thing', class Thing {
  constructor ({ itemOne }) {
    this.value = itemOne
  }

  action () {
    console.log('It Works!')
  }
})

const thing = container.resolve('thing')
//--> thing - Thing { value: 1 }

thing.action()
//---> Logs "It Works!""
```

### Injection Typing

In all of the above examples, injected dependencies will be have type *any*
inside of the provider definition. This works for many situations, but ideally the correct type for the injected value would be made available for the developer. In order to do this a custom interface can be given as a generic type to the *Container* constructor.

```ts
interface Types {
  itemOne: number
}

const container = new Container<Types>()

container.register('itemOne', () => {
  return 1
})

container.invoke(({ itemOne }) => {
  // itemOne will have type number
})
```

 
