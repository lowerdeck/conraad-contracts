import { z } from 'zod'
import { identifier } from './common'

/**
 * Repeats a section or item once for every item of an array variable, which is known by the name in `as` inside it.
 */
export function each() {
  return z.object({
    in: identifier(),
    as: identifier(),
  })
}

export type Each = z.output<ReturnType<typeof each>>

export namespace Each {

  /**
   * The ID of one repetition of a section or item. What's inside a repetition gets the same suffix, so that the ID
   * of a repetition within a repetition is like `abc~0~2`.
   */
  export function instanceId(id: string, index: number): string {
    return `${id}${separator}${index}`
  }

  /** The ID of the section or item in the template, for an ID that may be one of its repetitions. */
  export function templateId(id: string): string {
    const index = id.indexOf(separator)
    return index === -1 ? id : id.slice(0, index)
  }

  export function isInstanceId(id: string): boolean {
    return id.includes(separator)
  }

}

const separator = '~'
