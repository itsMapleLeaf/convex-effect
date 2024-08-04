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
- query context
  - [x] database reader
  - [x] system database reader
  - [ ] auth
  - [ ] storage
  - [ ] `runQuery`
  - [ ] service
- mutation context
  - [x] database writer
  - [ ] auth
  - [ ] storage
  - [ ] scheduler
  - [ ] `runQuery`
  - [ ] `runMutation`
  - [ ] service
- action context
  - [ ] `runQuery`
  - [ ] `runMutation`
  - [ ] `runAction`
  - [ ] auth
  - [ ] storage
  - [ ] scheduler
  - [ ] vector search
  - [ ] service

## ideas

- [Convex Auth](https://labs.convex.dev/auth) wrappers?
- serialize `Option` to null
  - and, subsequently, remove the `*OrNull` methods and return `Option` from the normal ones
- streams
