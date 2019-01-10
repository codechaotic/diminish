[![Coverage Status](https://coveralls.io/repos/github/codechaotic/diminish/badge.svg?branch=develop)](https://coveralls.io/github/codechaotic/diminish?branch=develop)

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

### Literal Providers

Injecting a provider isn't always what you need. For example, you may want to register a function in a container. You could do this but wrapping the function up in a lightweight do-nothing provider as follows:

```ts
function someFunction () {
  console.log('Hey!')
}

container.register('someFunction', () => someFunction)
```

To make this easier Diminish includes another method on a container that does the above for you called `literal`.

```ts
// Adds the function as a trivial provider
container.literal('someFunction', someFunction)
```

### Bulk Registration

Often many providers need to be registered at the same time. To make this easier both the `register` and `literal` methods will accept an object dictionary of providers or values respectively.

```ts
container.register({
  itemOne () {
    return 10
  },
  itemTwo ({ itemOne }) {
    return itemOne + 10
  }
})

container.literal({
  someFunction () {
    console.log('Hey')
  },
  someValue: 15
})
```
### Injection Typing

In all of the above examples, injected dependencies will have type *any* inside of the provider definition. This works for many simple situations but ideally the types for your dependencies should be available inside the provider. In order to do this a custom interface can be given as a generic type to the *Container* constructor.

```ts
interface Types {
  itemOne: number
}

const container = new Container<Types>()
```

The `register` method will only allow registration of names and providers which correspond to a property defined on the generic interface.

```ts
container.register('itemOne', () => 10) // OK
container.register('itemTwo', () => 20) // ERROR
```

The same is true for the `resolve` method. Only keys from the given interface can be requested from the container.

```ts
const itemOne = container.resolve('itemOne') // OK
const itemTwo = container.resolve('itemTwo') // ERROR
```

To use this inside of your providers, use the interface as the parameter type in the function or constructor definition.

```ts
// Function
const provider = function ({ itemOne } : Types) {}

// Class
const provider = class {
  constructor ({ itemOne } : Types) {}
}
```

### Support for Standard Parameters

So far we've only used examples where dependency injection is done using the destructured parameter style. This style is preferred in most cases. However support for standard parameters is included with diminish without any fuss.

```ts
// This works just fine
const provider = function itemTwo (itemOne: any) {}
```

Properly resolving types in your providers will require an additional step. In addition to creating an interface as above, you must create a namespace with the same name and declare the dependency types inside it.

```ts
interface Types {
  itemOne: number
}

namespace Types {
  type itemOne = number
}
```

Now the type can be accessed and used in the provider definitions

```ts
// Now this works too
const provider = function itemTwo (itemOne: Types.itemOne) {}
```

### Global Type

In the above examples the interface used must be defined before the container is created. This means all of the dependencies and their types must be declared or imported prior to that point in the file. This can create issues when working with providers defined in different files. Trying to properly manage your imports in these situations can be complicated, which defeats the purpose of this package.

To get around this it is possible to declare your generic interface as part of the global scope. While in a general sense using the global scope is a touchy practice, I have found this to be a reasonable place to use it. Once created, in each of your files that global interface can be merged with a local interface of the same name and a new property (See [Merging Interfaces](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces)) effectively allowing you to decentralize your type declarations.

```ts
// index.ts
import { Container } from 'diminish'
import { itemOneProvider } from './itemOne.ts'
import { itemTwoProvider } from './itemTwo.ts'

declare global {
  interface Types {}
  namespace Types {}
}

const container = new Container<Types>()
container.register('itemOne', itemOneProvider) // OK
container.register('itemTwo', itemTwoProvider) // OK

const itemTwo = container.resolve('itemTwo') // OK
// here itemTwo has type number | Promise<number>
```

```ts
// itemOne.ts

declare global {
  interface Types { itemOne: number }
  namespace Types { type itemOne = number }
}

export function itemOneProvider() : number{
  return 10
}
```

```ts
// itemTwo.ts

declare global {
  interface Types { itemTwo: number }
  namespace Types { type itemTwo = number }
}

export function itemTwoProvider({ itemOne } : Types) : number {
  // here itemOne will correctly have type
  return itemOne + 10
}

// OR

export function itemTwoProvider(itemOne : Types.itemOne) : number {
  // here itemOne will correctly have type
  return itemOne + 10
}
```
