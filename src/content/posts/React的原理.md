---
title: 初探React
pubDate: 2025-05-05
categories: ['React']
description: ''
slug: react
---

### 什么是render

1. rendering的定义：react是如何基于当前的props和state进行ui渲染的

2. render过程一览：
   - 从fiber树的节点root，到子节点child，进行遍历，寻找被标记上需要更新的节点

   - 对于每一个被打上标记待更新的节点，会通过如下的过程去执行更新节点的所需要的前置信息计算

     > For each flagged component, React will call either `FunctionComponent(props)` (for function components), or `classComponentInstance.render()` (for class components) , and save the render output for the next steps of the render pass。

     在这里，我们得知，react的render阶段，主要是在收集flagged被打上标签的节点，然后对他们执行render()操作（ps：函数式组件使用 `FunctionComponent(props)`，类组件使用`classComponentInstance.render()`），收集render()操作的产物，以便于后续更新执行diff计算

     如下，便是这一过程的代码示例：

```jsx
// This JSX syntax:
// 当我们使用函数式创建组件时
return <MyComponent a={42} b="testing">Text here</MyComponent>

// is converted to this call:
// 组件会通过createElement()生成描述组件的UI-value形式的react节点,即如下行代码所示
return React.createElement(MyComponent, {a: 42, b: "testing"}, "Text Here")

// and that becomes this element object:
{type: MyComponent, props: {a: 42, b: "testing"}, children: ["Text Here"]}

// And internally, React calls the actual function to render it:
// 使用`FunctionComponent(props)`
// 在render phase的最后阶段，会调用render()，生成render phase操作的产物以便于后续commit phase进行diff更新
// 这一产物也是一种UI-value的对象，并不是一种的dom节点
let elements = MyComponent({...props, children})

// For "host components" like HTML:
// 对于内置的html标签来说就是也是类似的过程
return <button onClick={() => {}}>Click Me</button>
// becomes
React.createElement("button", {onClick}, "Click Me")
// and finally:
{type: "button", props: {onClick}, children: ["Click me"]}
```

等到react收集完当前组件树所有待更新节点的render()产物后（这一产物也被叫做visual dom），会执行水合操作[reconciliation](https://legacy.reactjs.org/docs/reconciliation.html).去进行新旧组件树节点的差异比对，等到收集完所有差异后，进行一次性同步更新真实dom的操作。

#### render的产物不是dom

> **Note:** The React team has downplayed the term "virtual DOM" in recent years. [Dan Abramov said](https://twitter.com/dan_abramov/status/1066328666341294080?lang=en):
>
> I wish we could retire the term “virtual DOM”. It made sense in 2013 because otherwise people assumed React creates DOM nodes on every render. But people rarely assume this today. “Virtual DOM” sounds like a workaround for some DOM issue. But that’s not what React is.
> React is “value UI”. Its core principle is that UI is a value, just like a string or an array. You can keep it in a variable, pass it around, use JavaScript control flow with it, and so on. That expressiveness is the point — not some diffing to avoid applying changes to the DOM.
> It doesn’t even always represent the DOM, for example `<Message recipientId={10} />` is not DOM. Conceptually it represents lazy function calls: `Message.bind(null, { recipientId: 10 })`.

这里主要是想说，diff的水合过程并不真的完完全全就是新建虚拟dom与旧的真实的dom进行比对的过程，react是一个值驱动ui变化的框架，本质上所有diff过程中用到的产物都是一种`UI-value`形式的对象，可以是string或者是array等等js的基本类型对象，而不仅仅只是dom而已。本质上react只是为了更好的进行值比对，驱动视图变化，而不是为了创建新dom，替换旧dom。就像上述代码这样：

```jsx
{type: MyComponent, props: {a: 42, b: "testing"}, children: ["Text Here"]}

// And internally, React calls the actual function to render it:
// 使用`FunctionComponent(props)`
// 在render phase的最后阶段，会调用render()，生成render phase操作的产物以便于后续commit phase进行diff更新
// 这一产物也是一种UI-value的对象，并不是一种的dom节点
let elements = MyComponent({...props, children})
```

> _It doesn’t even always represent the DOM, for example_ `<Message recipientId={10} />` _is not DOM. Conceptually it represents lazy function calls:_ `Message.bind(null, { recipientId: 10 })`_._

这里也是一样的意思`<Message recipientId={10} />`并不是一个真实dom，而只是一个bind函数回调`Message.bind(null, { recipientId: 10 })`_._

### render和commit阶段

整个react作业的过程分为两个阶段

- render：渲染组件，收集待更新节点的相关信息，形成渲染产物

- commit：将render阶段收集到的信息执行到真实dom上

  > After React has updated the DOM in the commit phase, it updates all refs accordingly to point to the requested DOM nodes and component instances. It then synchronously runs the `componentDidMount` and `componentDidUpdate` class lifecycle methods, and the `useLayoutEffect` hooks.

  执行完dom更新后，所有的component实例和refs绑定的对象都会被更新，之后便会开始执行`componentDidMount` 、和`componentDidUpdate`生命周期函数，以及`useLayoutEffect`钩子函数

  > React then sets a short timeout, and when it expires, runs all the `useEffect` hooks. This step is also known as the "Passive Effects" phase.

  之后才会进行短暂的延迟更新，叫做`Passive Effects`阶段，去执行所有的useEffect钩子函数。值得一提的是，在react18，引入了useTransition，能够在render phase 阶段去暂停render，去获取浏览器相关数据，然后再执行render。所有这里引入的概念就是“react中的rendering 概念并不是只是用于渲染虚拟dom的阶段，来更新dom而已，一些未存在显性页面变化的操作背后，也可能在执行rendering”

### React是如何处理Render的

执行re-render的方法如下：

After the initial render has completed, there are a few different ways to tell React to queue a re-render:

- Function components:
  - `useState` setters
  - `useReducer` dispatches
- Class components:
  - `this.setState()`
  - `this.forceUpdate()`
- Other:
  - Calling the ReactDOM top-level `render(<App>)` method again (which is equivalent to calling `forceUpdate()` on the root component)
  - Updates triggered from the new `useSyncExternalStore` hook

Note that function components don't have a `forceUpdate` method, but you can get the same behavior by using a `useReducer` hook that always increments a counter:

```js
const [, forceRender] = useReducer(c => c + 1, 0)
```

> **Rendering a component will, by default, cause \*all\* components inside of it to be rendered too!**
>
> Also, another key point:
>
> **In normal rendering, React does \*not\* care whether "props changed" - it will render child components unconditionally just because the parent rendered!**
>
> This means that calling `setState()` in your root `<App>` component, with no other changes altering the behavior, _will_ cause React to re-render every single component in the component tree. After all, one of the original sales pitches for React was ["act like we're redrawing the entire app on every update"](https://www.slideshare.net/floydophone/react-preso-v2).

react组件渲染的逻辑就是父组件发生改变，所有子组件跟着一起re-render

> Now, it's very likely that most of the components in the tree will return the exact same render output as last time, and therefore React won't need to make any changes to the DOM. _But_, React will still have to do the work of asking components to render themselves and diffing the render output. Both of those take time and effort.

哪怕是没变更的节点，也会对props的变量进行引用值地址的更新，执行render，同时也会也要进行diff比对询问是否需要被打上标签，如

```jsx
const MemoizedChildComponent = React.memo(ChildComponent)

function ParentComponent() {
  const onClick = () => {
    console.log('Button clicked')
  }

  const data = { a: 1, b: 2 }

  return <MemoizedChildComponent onClick={onClick} data={data} />
}
```

即使childcomponent已经被memo，但是每次parentComponent变更时，仍然会重新渲染MemoizedChildComponent，因为即使函数内容相同,它在每次渲染时都是一个新的函数引用。

> Similarly, note that rendering `<MemoizedChild><OtherComponent /></MemoizedChild>` will _also_ force the child to always render, because `props.children` is always a new reference.

### Fiber架构

#### Hooks must be called on the top level

hook本质上只是一个array，这里介绍了原理，https://www.swyx.io/hooks#getting-closure-on-react-hooks，useState本质上就是一个闭包（closures），然后hooks设计成数组形式，便于组件逐步执行hook。每个hook都有自己特定的index和对应的值。同时这也是为什么

> **This is why Hooks must be called on the top level of our components.** If we want to run an effect conditionally, we can put that condition _inside_ our Hook:

https://legacy.reactjs.org/docs/hooks-rules.html#explanation

比如说if条件内的useEffect被skipped掉了话，但是原本componetInstance组件实例作用域内的hookArray的hookIndex还是保持原来的样子，这样就会导致后续hook的index找不到对应的数据，进一步报错，不执行后续的hook了

### 优化Render的方式

- React.memo()
- [`React.Component.shouldComponentUpdate`](https://react.dev/reference/react/Component#shouldcomponentupdate)
- [`React.PureComponent`](https://react.dev/reference/react/PureComponent)

> All of these approaches use a comparison technique called **"shallow equality"**. This means checking every individual field in two different objects, and seeing if any of the _contents_ of the objects are a different value. In other words, `obj1.a === obj2.a && obj1.b === obj2.b && ........`. This is typically a fast process, because `===` comparisons are very simple for the JS engine to do. So, these three approaches do the equivalent of `const shouldRender = !shallowEqual(newProps, prevProps)`.

上述几种优化方式都是浅比较。

- If you include `props.children` in your output, that element is the same if this component does a state update

```jsx
// The `props.children` content won't re-render if we update state
function SomeProvider({ children }) {
  const [counter, setCounter] = useState(0)

  return (
    <div>
      <button onClick={() => setCounter(counter + 1)}>
        Count:
        {counter}
      </button>
      <OtherChildComponent />
      {children}
    </div>
  )
}
```

- If you wrap some elements with `useMemo()`, those will stay the same until the dependencies change

```jsx
function OptimizedParent() {
  const [counter1, setCounter1] = useState(0)
  const [counter2, setCounter2] = useState(0)

  const memoizedElement = useMemo(() => {
    // This element stays the same reference if counter 2 is updated,
    // so it won't re-render unless counter 1 changes
    return <ExpensiveChildComponent />
  }, [counter1])

  return (
    <div>
      <button onClick={() => setCounter1(counter1 + 1)}>
        Counter 1:
        {' '}
        {counter1}
      </button>
      <button onClick={() => setCounter1(counter2 + 1)}>
        Counter 2:
        {' '}
        {counter2}
      </button>
      {memoizedElement}
    </div>
  )
}
```

> For all of these techniques, **skipping rendering a component means React will also skip rendering that entire subtree**, because it's effectively putting a stop sign up to halt the default "render children recursively" behavior.

当前组件的render被skipped之后，所有的子节点的render也会被skipped。

### 是否有必要Memoize Everything

#### 为什么不使用react.memo去包裹所有组件

根据博客中的这句话

> Also, while I don't have a specific link on it, it's possible that trying to apply this to all components by default might result in bugs due to cases where people are mutating data rather than updating it immutably.

```jsx
function Parent() {
  const [user, setUser] = React.useState({ name: 'Alice' })

  const updateUser = () => {
    // 直接修改 user 对象
    user.name = 'Bob' // 这是可变更新
    setUser(user) // 这不会触发重新渲染
  }

  return (
    <div>
      <MyComponent user={user} />
      <button onClick={updateUser}>Change Name</button>
    </div>
  )
}
```

比如说我们使用mutating data的方式，去直接改变数据，这个时候，user引用并没有改变，memo并不会发现Mycomponent的变化。

但是如果我们使用immutable的方式，

```jsx
function updateUser() {
  setUser({ ...user, name: 'Bob' }) // 这是不可变更新
}
```

这样memo才会发现Mycomponent的变化。进一步触发更新。

所以如果所有的组件都被包裹上memo，但是用户可能使用mutating data的方式去修改props，这个时候可能就不会导致被memo组件的更新。

所以组件性能优化的核心在于使用imutable的触发方式，同时更多的去memo props 是否更新来进一步判断是否需要重新渲染子组件，而不是默认对所有子组件进行memo，因为很有可能在某些地方采用了mutable的方式去变更数据，而此时的memo并不起作用。[react官方解释](https://react.dev/reference/react/memo#should-you-add-memo-everywhere)

> **When a context provider has a new value, \*every\* nested component that consumes that context will be forced to re-render**.

> **That React Component Right Under Your Context Provider Should Probably Use `React.memo`**

react中，context.provider是通过比较值的引用地址来进一步判断消费他的组件是否需要变更。基本上使用了context的组件，建议都用memo包一层。
