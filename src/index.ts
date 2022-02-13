type BaseRuleValues = keyof ValuesDict
type BaseRuleOptionalValues = `${BaseRuleValues}?`
type RuleEnumValues = readonly (number | string | boolean)[]
type RuleEnumOptionalValues = readonly [...constants: RuleEnumValues, optional: undefined]

type ValuesDict = {
    'string': string
    'number': number
    'boolean': boolean
    'string|number': string | number
    'string|boolean': string | boolean
    'string|number|boolean': string | number | boolean
    'number|boolean': number | boolean
}

type TypedValues<V> = V extends readonly any[]
    ? GetEnumValues<V>
    : V extends BaseRuleValues
    ? ValuesDict[V]
    : V extends `${infer VV}?`
    ? VV extends BaseRuleValues
    ? ValuesDict[VV]
    : never
    : never

type GetEnumValues<V> = { [K in keyof V]: V[K] }[keyof V]

type GetTypedKeys<T, V> = { [KK in keyof V]: V[KK] extends T ? KK : never }[keyof V]

type ParamsRequired<R extends IRules, E extends keyof R> = {
    [KK in GetTypedKeys<BaseRuleValues | RuleEnumValues, R[E]>]: TypedValues<R[E][KK]>
}
type ParamsOptional<R extends IRules, E extends keyof R> = {
    [KK in GetTypedKeys<BaseRuleOptionalValues | RuleEnumOptionalValues, R[E]>]?: TypedValues<R[E][KK]>
}

type Params<R extends IRules, E extends keyof R> = ParamsRequired<R, E> & ParamsOptional<R, E>

interface IRuleValues {
    [key: string]: BaseRuleValues | BaseRuleOptionalValues | RuleEnumValues | RuleEnumOptionalValues
}

type IRules = {
    [key: string]: IRuleValues
}

type RuleValidator<R extends IRules, E extends keyof R> = (event: E, params: R[E], rules: R) => any

interface IReporterSender<R = any> {
    (event: string, params?: Record<string, any>): R | Promise<R>
}

interface IDefineConfig<R, C, S, VR> {
    common?: C
    rules: R
    sender: S
    validator?: VR
}

type GetSenderReturnType<S extends IReporterSender> = ReturnType<S> extends Promise<infer R> ? R : ReturnType<S>

interface IWithReportOptions<R extends IRules, E extends keyof R, C> {
    event: E
    params?: Params<R, E>
    common?: C | Record<string, any>
    order?: 'before' | 'after'
    always?: boolean
}

type WithReporterPrepare<R extends IRules, E extends keyof R, C, RT> = (error?: Error, result?: RT) => IWithReportOptions<R, E, C>

export class BaseReporter<R extends IRules, C extends Record<string, any>, S extends IReporterSender, VR extends RuleValidator<R, keyof R>> {

    private rules: R = Object.create(null)
    private common: C = Object.create(null)
    private sender: S
    private validator?: VR

    constructor(config: IDefineConfig<R, C, S, VR>) {
        Object.assign(this.rules, config?.rules)
        Object.assign(this.common, config?.common)
        this.sender = config?.sender
        this.validator = config?.validator
    }

    async send<E extends keyof R>(event: E, params?: Params<R, E>): Promise<GetSenderReturnType<S>> {

        // validating
        const { validator = this._defaultValidator } = this

        // TODO

        return await this.sender?.(event as string, params)
    }

    updateCommon(common?: Record<string, any>) {
        Object.assign(this.common, common)
    }

    withReporter<F extends (...args: any) => any, RT extends ReturnType<F>, E extends keyof R>(target: F, prepare: WithReporterPrepare<R, E, C, RT>): F {
        let result: RT
        const configBefore = prepare(undefined, {} as RT)
        const fn = async (...args: any[]) => {
            try {
                if (configBefore.order === 'before') {
                    this.send(configBefore.event, Object.assign({}, configBefore.common, configBefore.params))
                }

                result = await target(...args)

                if (configBefore.order === 'after') {
                    const configAfter = prepare(undefined, result)
                    this.send(configAfter.event, Object.assign({}, configAfter.common, configAfter.params))
                }

                return result
            } catch (e) {
                if (configBefore.always && configBefore.order === 'after') {
                    const configWhenError = prepare(e as Error, undefined)
                    this.send(configWhenError.event, Object.assign({}, configWhenError.common, configWhenError.params))
                }
                throw e
            }
        }

        return fn as F
    }

    private _defaultValidator(event: any, params: any, rules: any) {
        // TODO
    }
}
