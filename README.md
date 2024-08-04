# convex-effect

> [!warning]
> 🚧 work in progress do not use 🚧

## todo

- api functions
  - [x] `query`
  - [x] `queryInternal`
  - [x] `mutation`
  - [x] `internalMutation`
  - [x] `action`
  - [x] `internalAction`
  - [x] `httpAction`
- query & mutation context
  - [x] database reader
  - [x] system database reader
  - [x] auth
  - [x] storage
- mutation context
  - [x] database writer
  - [x] scheduler
- action context
  - [x] auth
  - [x] storage
  - [x] scheduler
  - [x] vector search
  - [x] `runQuery`
  - [x] `runMutation`
  - [x] `runAction`

## ideas

- [Convex Auth](https://labs.convex.dev/auth) wrappers?
- serialize `Option` to null
  - and, subsequently, remove the `*OrNull` methods and return `Option` from the normal ones
- streams
- context services?
