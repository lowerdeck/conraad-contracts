import jsepObject from '@jsep-plugin/object'
import jsepSpread from '@jsep-plugin/spread'
import jsep from 'jsep'
import { isFunction, objectEntries } from 'ytil'

jsep.plugins.register(jsepObject)
jsep.plugins.register(jsepSpread)
jsep.addBinaryOp('??', 1)
jsep.right_associative.add('??')

export { jsep }
export const global: Record<string, unknown> = {}
export const blacklist = new Set(['__proto__', 'prototype', 'constructor'])

function makeGlobalEnv() {
  for (const [key, value] of objectEntries(Math)) {
    if (typeof key !== 'string') { continue }
    if (key === 'random') { continue }

    if (isFunction(value)) {
      global[key] = value.bind(Math)
    } else if (typeof value === 'number') {
      global[key] = value
    }
  }
}
makeGlobalEnv()


