/* eslint-env jest */

import {
  formatMessage,
  invariant,
  warning,
  pendingActionEnhancer,
  errorActionEnhancer,
  defaultGetActionType,
  defaultCreatActionCreator,
  defaultActionHandle,
  createReducer
} from '..'

describe(
  're-reducer',
  () => {
    describe(
      '#formatMessage',
      () => {
        test(
          'should return sprintf-style format (only %s is supported) message.',
          () => {
            expect(formatMessage('%s-%s-%s-%s.', 1, 2, 3, 4)).toBe('1-2-3-4.')
          }
        )
      }
    )

    describe(
      '#invariant',
      () => {
        test(
          'should throw error when format argument is undefined in non-production environment.',
          () => {
            expect(() => {
              invariant(false)
            })
            .toThrow()
            expect(() => {
              invariant(true)
            })
            .toThrow()
            expect(() => {
              invariant(true, 'test.')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when condition argument is falsy in production environment.',
          () => {
            process.env.NODE_ENV = 'production'

            expect(() => {
              invariant(false)
            })
            .toThrow()
            expect(() => {
              invariant(false, 'test.')
            })
            .toThrow()
            expect(() => {
              invariant(true)
            })
            .not
            .toThrow()

            process.env.NODE_ENV = 'test'
          }
        )

        test(
          'should not throw error when condition argument is true and format argument is a string.',
          () => {
            expect(() => {
              invariant(true, 'test.')
            })
            .not
            .toThrow()
            expect(() => {
              invariant(false, 'test.')
            })
            .toThrow()
          }
        )

        test(
          'should throw sprintf-style format (only %s is supported) message error.',
          () => {
            expect(() => {
              invariant(false, '%s-%s-%s-%s-%s.', 1, 2, 3, 4, 5)
            })
            .toThrow(/^1-2-3-4-5\.$/)
          }
        )
      }
    )

    describe(
      '#warning',
      () => {
        const _error = global.console.error
        beforeEach(() => {
          global.console.error = jest.fn()
        })

        afterEach(() => {
          global.console.error = _error.bind(global.console)
        })

        test(
          'should throw error when format argument is undefined in non-production environment.',
          () => {
            expect(() => {
              warning(false)
            })
            .toThrow()
            expect(() => {
              warning(true)
            })
            .toThrow()
            expect(() => {
              warning(true, 'test.')
            })
            .not
            .toThrow()
            expect(() => {
              warning(false, 'test.')
            })
            .not
            .toThrow()
            expect(global.console.error.mock.calls.length).toBe(1)
          }
        )

        test(
          'should not thorw error when format argument is undefined in production environment.',
          () => {
            process.env.NODE_ENV = 'production'

            expect(() => {
              warning(false)
            })
            .not
            .toThrow()
            expect(() => {
              warning(true)
            })
            .not
            .toThrow()

            process.env.NODE_ENV = 'test'
          }
        )

        test(
          'should not throw when console in undefined in context.',
          () => {
            const _console = global.console

            global.console = undefined

            expect(() => {
              warning(false, 'test.')
            })
            .not
            .toThrow()

            global.console = _console
          }
        )

        test(
          'should not print message in production environment.',
          () => {
            process.env.NODE_ENV = 'production'

            warning(false, '%s-%s-%s-%s.', 1, 2, 3, 4)
            expect(global.console.error.mock.calls.length).toBe(0)

            process.env.NODE_ENV = 'test'
          }
        )

        test(
          'should print sprintf-style format (only %s is supported) message in non-production environment.',
          () => {
            warning(false, '%s-%s-%s-%s.', 1, 2, 3, 4)
            expect(global.console.error.mock.calls.length).toBe(1)
            expect(global.console.error.mock.calls[0][0]).toBe('Warning: 1-2-3-4.')
          }
        )
      }
    )

    describe(
      '#pendingActionEnhancer',
      () => {
        test(
          'should throw error when next argument is not a function.',
          () => {
            expect(() => {
              pendingActionEnhancer()
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(null)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(true)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(1)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer('test')
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer({})
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when the extra argument of' +
          'the wrapped function of next is not an object or undefined.',
          () => {
            expect(() => {
              pendingActionEnhancer(() => {})('test', null)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})('test', true)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})('test', 1)
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})('test', 'test')
            })
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})('test', {})
            })
            .not
            .toThrow()
            expect(() => {
              pendingActionEnhancer(() => {})('test')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should merge the extra argument with "{ meta: { pending: true } }."',
          () => {
            const mockNext = jest.fn()
            const pendingExtra = { meta: { pending: true } }
            const wrapped = pendingActionEnhancer(mockNext)

            expect(mockNext.mock.calls.length).toBe(0)

            wrapped('test')

            expect(mockNext.mock.calls.length).toBe(1)
            expect(mockNext.mock.calls[0][0]).toBe('test')
            expect(mockNext.mock.calls[0][1]).toEqual(pendingExtra)

            wrapped('test', { test: true })

            expect(mockNext.mock.calls.length).toBe(2)
            expect(mockNext.mock.calls[1][0]).toBe('test')
            expect(mockNext.mock.calls[1][1]).toEqual({
              test: true,
              ...pendingExtra
            })

            wrapped('test', { test: true, meta: { pending: false } })

            expect(mockNext.mock.calls.length).toBe(3)
            expect(mockNext.mock.calls[2][0]).toBe('test')
            expect(mockNext.mock.calls[2][1]).toEqual({
              test: true,
              ...pendingExtra
            })
          }
        )
      }
    )

    describe(
      '#errorActionEnhancer',
      () => {
        test(
          'should throw error when next argument is not a function.',
          () => {
            expect(() => {
              errorActionEnhancer()
            })
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when the extra argument of' +
          'the wrapped function of next is not an object or undefined.',
          () => {
            expect(() => {
              errorActionEnhancer(() => {})('test', null)
            })
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})('test', true)
            })
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})('test', 1)
            })
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})('test', 'test')
            })
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})('test', {})
            })
            .not
            .toThrow()
            expect(() => {
              errorActionEnhancer(() => {})('test')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should merge the extra argument with "{ error: true }."',
          () => {
            const mockNext = jest.fn()
            const errorExra = { error: true }
            const wrapped = errorActionEnhancer(mockNext)

            expect(mockNext.mock.calls.length).toBe(0)

            wrapped('test')

            expect(mockNext.mock.calls.length).toBe(1)
            expect(mockNext.mock.calls[0][0]).toBe('test')
            expect(mockNext.mock.calls[0][1]).toEqual(errorExra)

            wrapped('test', { test: true })

            expect(mockNext.mock.calls.length).toBe(2)
            expect(mockNext.mock.calls[1][0]).toBe('test')
            expect(mockNext.mock.calls[1][1]).toEqual({
              test: true,
              ...errorExra
            })

            wrapped('test', { test: true, error: false })

            expect(mockNext.mock.calls.length).toBe(3)
            expect(mockNext.mock.calls[2][0]).toBe('test')
            expect(mockNext.mock.calls[2][1]).toEqual({
              test: true,
              ...errorExra
            })
          }
        )
      }
    )

    describe(
      '#defaultGetActionType',
      () => {
        test(
          'should throw error when type argument is not a string.',
          () => {
            expect(() => {
              defaultGetActionType()
            })
            .toThrow()
            expect(() => {
              defaultGetActionType(null)
            })
            .toThrow()
            expect(() => {
              defaultGetActionType(true)
            })
            .toThrow()
            expect(() => {
              defaultGetActionType(1)
            })
            .toThrow()
            expect(() => {
              defaultGetActionType({})
            })
            .toThrow()
            expect(() => {
              defaultGetActionType('test')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should return type argument when the prefix argument is undefined.',
          () => {
            expect(defaultGetActionType('test')).toBe('test')
            expect(defaultGetActionType('test', null)).not.toBe('test')
            expect(defaultGetActionType('test', true)).not.toBe('test')
            expect(defaultGetActionType('test', 1)).not.toBe('test')
            expect(defaultGetActionType('test', {})).not.toBe('test')
            expect(defaultGetActionType('test', 'prefix')).not.toBe('test')
          }
        )

        test(
          'should return prefix argument and type argument ' +
          'join with "/" when prefix is not undefined.',
          () => {
            expect(defaultGetActionType('test', null)).toBe([String(null), 'test'].join('/'))
            expect(defaultGetActionType('test', true)).toBe([String(true), 'test'].join('/'))
            expect(defaultGetActionType('test', 1)).toBe([String(1), 'test'].join('/'))
            expect(defaultGetActionType('test', {})).toBe([String({}), 'test'].join('/'))
            expect(defaultGetActionType('test', 'prefix')).toBe(['prefix', 'test'].join('/'))
          }
        )
      }
    )

    describe(
      '#defaultCreatActionCreator',
      () => {
        test(
          'should throw error when type argument is not a string.',
          () => {
            expect(() => {
              defaultCreatActionCreator()
            })
            .toThrow()
            expect(() => {
              defaultCreatActionCreator(null)
            })
            .toThrow()
            expect(() => {
              defaultCreatActionCreator(true)
            })
            expect(() => {
              defaultCreatActionCreator(1)
            })
            .toThrow()
            expect(() => {
              defaultCreatActionCreator({})
            })
            .toThrow()
            expect(() => {
              defaultCreatActionCreator('test')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should return merge extra argument with object ' +
          'that composed of type and payload argument.',
          () => {
            const actionCreator = defaultCreatActionCreator('test')

            expect(actionCreator(true)).toEqual({ type: 'test', payload: true })
            expect(actionCreator(undefined)).toEqual({ type: 'test', payload: undefined })
            expect(actionCreator(true, null)).toEqual({ type: 'test', payload: true })
            expect(actionCreator(true, 1)).toEqual({ type: 'test', payload: true })
            expect(actionCreator(
              'payload',
              { type: 'test2', payload: 'payload 2', meta: { test: true } }
            ))
            .toEqual({ type: 'test', payload: 'payload', meta: { test: true } })
          }
        )
      }
    )

    describe(
      '#defaultActionHandle',
      () => {
        const initialStateWithPending = {
          pending: true
        }
        const initialStateWithoutPending = {
          test: false
        }
        const pendingAction = {
          type: 'pending',
          meta: {
            pending: true
          }
        }
        const errorAction = {
          type: 'error',
          error: true
        }
        const normalAction = {
          type: 'normal',
          payload: {
            test: true,
            pending: true
          }
        }

        test(
          'should throw error when state argument is not an object.',
          () => {
            expect(() => {
              defaultActionHandle(undefined, normalAction)
            })
            .toThrow()
            expect(() => {
              defaultActionHandle(null, normalAction)
            })
            .toThrow()
            expect(() => {
              defaultActionHandle(true, normalAction)
            })
            .toThrow()
            expect(() => {
              defaultActionHandle(1, normalAction)
            })
            .toThrow()
            expect(() => {
              defaultActionHandle('test', normalAction)
            })
            .toThrow()
            expect(() => {
              defaultActionHandle({}, normalAction)
            })
            .not
            .toThrow()
          }
        )

        test(
          'should not changen the state when received a pending or error action.',
          () => {
            expect(defaultActionHandle(initialStateWithoutPending, pendingAction))
              .toBe(initialStateWithoutPending)
            expect(defaultActionHandle(initialStateWithoutPending, errorAction))
              .toBe(initialStateWithoutPending)
            expect(defaultActionHandle(initialStateWithoutPending, normalAction))
              .not
              .toBe(initialStateWithoutPending)
          }
        )

        test(
          'should merge with payload when state has not pending property.',
          () => {
            expect(defaultActionHandle(initialStateWithoutPending, normalAction))
              .toEqual({
                ...initialStateWithoutPending,
                ...normalAction.payload
              })
            expect(defaultActionHandle(initialStateWithPending, normalAction))
              .not
              .toEqual({
                ...initialStateWithPending,
                ...normalAction.payload
              })
          }
        )

        test(
          'should merge state with "{ pending: false }" when state has pending property.',
          () => {
            expect(defaultActionHandle(initialStateWithPending, normalAction))
              .toEqual({
                ...initialStateWithPending,
                ...normalAction.payload,
                pending: false
              })
            expect(defaultActionHandle(initialStateWithoutPending, normalAction))
              .not
              .toEqual({
                ...initialStateWithoutPending,
                ...normalAction.payload,
                pending: false
              })
          }
        )
      }
    )

    describe(
      '#createReducer',
      () => {
        test(
          'should throw error when options.getActionType ' +
          'is not a function or undefined for use default.',
          () => {
            expect(() => {
              createReducer({
                getActionType: null
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: true
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: 1
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: 'test'
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: {}
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: () => {}
              })
            })
            .not
            .toThrow()
            expect(() => {
              createReducer({
                getActionType: undefined
              })
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when options.createActionCreator ' +
          'is not a function or undefined for use default.',
          () => {
            expect(() => {
              createReducer({
                createActionCreator: null
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: true
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: 1
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: 'test'
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: {}
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: () => {}
              })
            })
            .not
            .toThrow()
            expect(() => {
              createReducer({
                createActionCreator: undefined
              })
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when options.createPendingActionCreator ' +
          'is not a function or undefined for use default.',
          () => {
            expect(() => {
              createReducer({
                createPendingActionCreator: null
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: true
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: 1
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: 'test'
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: {}
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: () => {}
              })
            })
            .not
            .toThrow()
            expect(() => {
              createReducer({
                createPendingActionCreator: undefined
              })
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when options.createErrorActionCreator ' +
          'is not a function or undefined for use default.',
          () => {
            expect(() => {
              createReducer({
                createErrorActionCreator: null
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: true
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: 1
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: 'test'
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: {}
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: () => {}
              })
            })
            .not
            .toThrow()
            expect(() => {
              createReducer({
                createErrorActionCreator: undefined
              })
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when options.actionHandle ' +
          'is not a function or undefined for use default.',
          () => {
            expect(() => {
              createReducer({
                actionHandle: null
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: true
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: 1
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: 'test'
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: {}
              })
            })
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: () => {}
              })
            })
            .not
            .toThrow()
            expect(() => {
              createReducer({
                actionHandle: undefined
              })
            })
            .not
            .toThrow()
          }
        )

        test(
          'should return reducer function and exposses the public API on reducer.',
          () => {
            const reducer = createReducer()

            expect(typeof reducer).toBe('function')
            expect(typeof reducer.getHandles).toBe('function')
            expect(typeof reducer.register).toBe('function')
          }
        )

        test(
          'should throw error when type argument is not a string.',
          () => {
            const {
              register
            } = createReducer()

            expect(() => {
              register()
            })
            .toThrow()
            expect(() => {
              register(null)
            })
            .toThrow()
            expect(() => {
              register(true)
            })
            .toThrow()
            expect(() => {
              register(1)
            })
            .toThrow()
            expect(() => {
              register({})
            })
            .toThrow()
            expect(() => {
              register('test')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should print warning error when register a registerd action ' +
          'with another handle in non-production environment.',
          () => {
            const {
              register
            } = createReducer()
            const _error = global.console.error
            global.console.error = jest.fn()

            register('test')
            register('test')

            expect(global.console.error.mock.calls.length).toBe(0)

            register('test2')
            register('test2', () => {})
            expect(global.console.error.mock.calls.length).toBe(1)

            process.env.NODE_ENV = 'production'

            register('test3')
            register('test3')
            expect(global.console.error.mock.calls.length).toBe(1)

            process.env.NODE_ENV = 'test'

            global.console.error = _error.bind(global.console)
          }
        )

        test(
          'should throw error when handle is not a function or undefined for use default',
          () => {
            const {
              register
            } = createReducer()

            expect(() => {
              register('test', null)
            })
            .toThrow()
            expect(() => {
              register('test', true)
            })
            .toThrow()
            expect(() => {
              register('test', 1)
            })
            .toThrow()
            expect(() => {
              register('test', 'handle')
            })
            .toThrow()
            expect(() => {
              register('test', {})
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle)
            })
            .not
            .toThrow()
            expect(() => {
              register('test2')
            })
            .not
            .toThrow()
          }
        )

        test(
          'should throw error when enhancer is not a function ' +
          'that return another function or undefined for do not apply enhancer.',
          () => {
            const {
              register
            } = createReducer()

            expect(() => {
              register('test', defaultActionHandle, null)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, true)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, 1)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, 'enhancer')
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, {})
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => {})
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => null)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => true)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => 1)
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => 'action')
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, () => ({}))
            })
            .toThrow()
            expect(() => {
              register('test', defaultActionHandle, pendingActionEnhancer)
            })
            .not
            .toThrow()
            expect(() => {
              register('test2', defaultActionHandle)
            })
            .not
            .toThrow()
          }
        )

        test(
          'should return action creator function and exposses the public API ' +
          'and properties on action creator.',
          () => {
            const actionCreator = createReducer().register('test')

            expect(typeof actionCreator).toBe('function')
            expect(typeof actionCreator.pending).toBe('function')
            expect(typeof actionCreator.error).toBe('function')
            expect(typeof actionCreator.type).toBe('string')
            expect(typeof actionCreator.actionType).toBe('string')
          }
        )

        test(
          'should return an action object with action type.',
          () => {
            const actionCreator = createReducer().register('test')

            expect(actionCreator()).toEqual({ type: 'test', payload: undefined })
            expect(actionCreator(true)).toEqual({ type: 'test', payload: true })
            expect(actionCreator(true, {
              type: 'test2',
              payload: false,
              meta: { test: true }
            }))
            .toEqual({
              type: 'test',
              payload: true,
              meta: { test: true }
            })
          }
        )

        test(
          'should actionType build by getActionType with prefix and action type.',
          () => {
            const {
              type,
              actionType
            } = createReducer({
              prefix: 'test'
            }).register('action')

            expect(defaultGetActionType(type, 'test')).toBe(actionType)
          }
        )

        test(
          'should actionCreator create by createActionCreator when enhancer is not defined.',
          () => {
            const actionCreator = createReducer().register('test')

            expect(actionCreator()).toEqual(defaultCreatActionCreator('test')())
          }
        )

        test(
          'should actionCreator.pending create by createActionCreator returned actionCreator ' +
          'wrapped by createPendingActionCreator when enhancer is not undefined.',
          () => {
            const actionCreator = createReducer().register('test')

            expect(actionCreator.pending())
              .toEqual(pendingActionEnhancer(defaultCreatActionCreator('test'))())
          }
        )

        test(
          'should actionCreator.error create by createActionCreator returned actionCreator ' +
          'wrapped by createErrorActionCreator when enhancer is not undefined.',
          () => {
            const actionCreator = createReducer().register('test')

            expect(actionCreator.error())
              .toEqual(errorActionEnhancer(defaultCreatActionCreator('test'))())
          }
        )

        test(
          'should actionCreator create by createActionCreator ' +
          'returned actionCreator wrapped by enhancer.',
          () => {
            const enhancer = next => (payload, pending = false) => next(payload, { meta: pending })
            const actionCreator = createReducer().register('test', defaultActionHandle, enhancer)

            expect(actionCreator(true, false))
              .toEqual(enhancer(defaultCreatActionCreator('test'))(true, false))
          }
        )

        test(
          'should actionCreator.pending create by createActionCreator returned actionCreator ' +
          'wrapped by createPendingActionCreator and enhancer.',
          () => {
            const enhancer = next => (payload, pending = false) => next(payload, { meta: pending })
            const actionCreator = createReducer().register('test', defaultActionHandle, enhancer)

            expect(actionCreator.pending(true, false))
              .toEqual(
                enhancer(pendingActionEnhancer(defaultCreatActionCreator('test')))(true, false)
              )
          }
        )

        test(
          'should actionCreator.error create by createActionCreator returned actionCreator ' +
          'wrapped by createErrorActionCreator and enhancer.',
          () => {
            const enhancer = next => (payload, pending = false) => next(payload, { meta: pending })
            const actionCreator = createReducer().register('test', defaultActionHandle, enhancer)

            expect(actionCreator.error(true, false))
              .toEqual(
                enhancer(errorActionEnhancer(defaultCreatActionCreator('test')))(true, false)
              )
          }
        )

        test(
          'should return a object with key and value by the registed action type and handle.',
          () => {
            const {
              register,
              getHandles
            } = createReducer()
            const test1 = register('test1')
            const test2 = register('test2')
            const handles = getHandles()

            expect(handles).toEqual({
              [test1.actionType]: defaultActionHandle,
              [test2.actionType]: defaultActionHandle
            })
          }
        )

        test(
          'should use initialState as previous when the previous is undefined.',
          () => {
            const initialState = {
              test: false
            }
            const reducer = createReducer({
              initialState
            })
            const test = reducer.register('test')

            expect(reducer(undefined, test({ test: true })))
              .toEqual(reducer(initialState, test({ test: true })))
          }
        )

        test(
          'should return the previous state when a action is not registed.',
          () => {
            const initialState = {
              test: false
            }
            const reducer = createReducer({
              initialState
            })

            expect(reducer(initialState, { type: 'test', payload: { test: true } }))
              .toBe(initialState)
          }
        )

        test(
          'should return state that the registed action handle returned.',
          () => {
            const initialState = {
              test: false
            }
            const nextState = {
              test: true
            }
            const reducer = createReducer({
              initialState
            })
            const test = reducer.register('test')

            expect(reducer(initialState, test({ test: true })))
              .toEqual(nextState)
          }
        )
      }
    )
  }
)
