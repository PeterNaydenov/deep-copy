import deepCopy, { type Settings } from '@peter.naydenov/deep-copy'

const options: Settings = { detectCycles: false }
const result = deepCopy({ name: 'item', values: [1, 2], nested: { enabled: true } }, options)
result.name.toUpperCase()
result.values.push(3)
const enabled: boolean = result.nested.enabled
const primitive: number = deepCopy(12)
const missing: undefined = deepCopy(undefined)
void enabled
void primitive
void missing

// @ts-expect-error detectCycles is a boolean
const invalid: Settings = { detectCycles: 'no' }
// @ts-expect-error The returned array holds numbers
result.values.push('wrong')
void invalid
