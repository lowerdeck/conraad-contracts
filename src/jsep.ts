import jsepObject from '@jsep-plugin/object'
import jsepSpread from '@jsep-plugin/spread'
import jsep from 'jsep'
import { isFunction } from 'ytil'

jsep.plugins.register(jsepObject)
jsep.plugins.register(jsepSpread)
jsep.addBinaryOp('??', 1)
jsep.right_associative.add('??')

export { jsep }
export const global: Record<string, unknown> = {}
export const blacklist = new Set(['__proto__', 'prototype', 'constructor'])

function makeGlobalEnv() {
  // The members of Math aren't enumerable.
  for (const key of Object.getOwnPropertyNames(Math)) {
    if (key === 'random') { continue }

    const value = (Math as unknown as Record<string, unknown>)[key]

    if (isFunction(value)) {
      global[key] = value.bind(Math)
    } else if (typeof value === 'number') {
      global[key] = value
    }
  }
}
makeGlobalEnv()


