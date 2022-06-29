## RxJS utils

Utility functions for rx-js written in Typescript.

### dot('propertyName')
selects a property name from an object

```typescript
of({prop: 'foo'}).pipe(
    dot('prop'),
    tap(x => x ) // 'foo'
)
```

### switchToLatestFrom
Uses withLatestFrom and then retrieves just the second observable in the array

```typescript
of('testing').pipe(
    switchToLatestFrom(of('another')),
    tap(x => x) // another
)
```

