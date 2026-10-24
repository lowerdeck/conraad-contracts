import { describe, expect, it } from 'vitest'
import { ContractSection, ListItem, ListSection } from '../../structure'
import { ContractAddition } from '../addition'
import { anchorAt, resolveAnchor } from '../anchor'
import { mergeAdditions } from '../mergeAdditions'

describe('mergeAdditions', () => {

  it('inserts a section next to the section it was added after', () => {
    const sections = [text('a'), text('b'), text('c')]
    const addition = sectionAddition('x', sections, 'b', 'after')

    const {sections: merged, orphans} = mergeAdditions(sections, [addition])
    expect(merged.map(it => it.id)).toEqual(['a', 'b', 'x', 'c'])
    expect(orphans).toEqual([])
  })

  it('does not modify the sections it is given', () => {
    const sections = [text('a'), list('l', [item('1')])]
    const additions = [sectionAddition('x', sections, 'a', 'after'), itemAddition('y', sections, '1', 'after')]

    mergeAdditions(sections, additions)
    expect(sections.map(it => it.id)).toEqual(['a', 'l'])
    expect((sections[1] as ListSection).items.map(it => it.id)).toEqual(['1'])
  })

  it('falls back to the nearest remaining sibling when the one it was added after is gone', () => {
    const sections = [text('a'), text('b'), text('c'), text('d')]
    const addition = sectionAddition('x', sections, 'c', 'after')

    const withoutC = sections.filter(it => it.id !== 'c')
    expect(ids(mergeAdditions(withoutC, [addition]).sections)).toEqual(['a', 'b', 'x', 'd'])

    const withoutBC = sections.filter(it => it.id !== 'b' && it.id !== 'c')
    expect(ids(mergeAdditions(withoutBC, [addition]).sections)).toEqual(['a', 'x', 'd'])
  })

  it('falls back to the sibling after it when there is none before it', () => {
    const sections = [text('a'), text('b'), text('c')]
    const addition = sectionAddition('x', sections, 'a', 'after')

    const remaining = sections.filter(it => it.id !== 'a')
    expect(ids(mergeAdditions(remaining, [addition]).sections)).toEqual(['x', 'b', 'c'])
  })

  it('stays last when it was added at the end and its siblings are gone', () => {
    const sections = [text('a'), text('b')]
    const addition = sectionAddition('x', sections, null, 'end')

    expect(ids(mergeAdditions([text('c')], [addition]).sections)).toEqual(['c', 'x'])
  })

  it('stays put next to a sibling that was added before it, even when that addition is removed', () => {
    const sections = [text('a'), text('b')]
    const first = sectionAddition('x', sections, 'a', 'after')
    const withFirst = mergeAdditions(sections, [first]).sections
    const second = sectionAddition('y', withFirst, 'x', 'after')

    expect(ids(mergeAdditions(sections, [first, second]).sections)).toEqual(['a', 'x', 'y', 'b'])
    expect(ids(mergeAdditions(sections, [second]).sections)).toEqual(['a', 'y', 'b'])
  })

  it('adds sub-items to list items', () => {
    const sections = [list('l', [item('1', [item('1.1')]), item('2')])]
    const addition = itemAddition('x', sections, '1.1', 'after')

    const merged = mergeAdditions(sections, [addition]).sections
    const items = ListItem.flatten((merged[0] as ListSection).items).map(it => [it.item.id, it.level])
    expect(items).toEqual([['1', 1], ['1.1', 2], ['x', 2], ['2', 1]])
  })

  it('returns additions as orphans when their parent is gone', () => {
    const sections = [list('l', [item('1', [item('1.1')]), item('2')])]
    const addition = itemAddition('x', sections, '1.1', 'after')

    const withoutParent = [list('l', [item('2')])]
    const {sections: merged, orphans} = mergeAdditions(withoutParent, [addition])
    expect(ListItem.flatten((merged[0] as ListSection).items).map(it => it.item.id)).toEqual(['2'])
    expect(orphans).toEqual([addition])
  })

  it('returns additions as orphans when their parent no longer takes them', () => {
    const sections = [list('l', [item('1')])]
    const addition = itemAddition('x', sections, '1', 'after')

    const {orphans} = mergeAdditions([text('l')], [addition])
    expect(orphans).toEqual([addition])
  })

})

describe('anchorAt', () => {

  it('records the siblings on either side, nearest first', () => {
    const sections = [text('a'), text('b'), text('c'), text('d')]
    expect(anchorAt(sections, 'b', 'after')).toEqual({
      type:   'section',
      anchor: {parent: null, after: ['b', 'a'], before: ['c', 'd']},
    })
  })

  it('anchors to the start or end of a container', () => {
    const sections = [list('l', [item('1'), item('2')])]
    expect(anchorAt(sections, 'l', 'start')?.anchor).toEqual({parent: 'l', after: [], before: ['1', '2']})
    expect(anchorAt(sections, '1', 'end')?.anchor).toEqual({parent: '1', after: [], before: []})
  })

  it('returns null for something that is not there', () => {
    expect(anchorAt([text('a')], 'x', 'after')).toBeNull()
    expect(anchorAt([text('a')], 'a', 'end')).toBeNull()
  })

})

describe('resolveAnchor', () => {

  it('tries the nearest siblings on either side in turn', () => {
    const anchor = {parent: null, after: ['b', 'a'], before: ['c', 'd']}
    expect(resolveAnchor(anchor, [{id: 'a'}, {id: 'd'}])).toBe(1)
    expect(resolveAnchor(anchor, [{id: 'c'}, {id: 'd'}])).toBe(0)
    expect(resolveAnchor(anchor, [{id: 'z'}])).toBe(0)
  })

})

function ids(sections: ContractSection[]) {
  return sections.map(it => it.id)
}

function text(id: string): ContractSection {
  return {id, type: 'text', name: null, body: null}
}

function list(id: string, items: ListItem[]): ContractSection {
  return {id, type: 'list', name: null, items}
}

function item(id: string, items: ListItem[] = []): ListItem {
  return {id, text: null, items}
}

function sectionAddition(id: string, sections: ContractSection[], target: string | null, position: 'before' | 'after' | 'start' | 'end'): ContractAddition {
  const result = anchorAt(sections, target, position)
  if (result?.type !== 'section') { throw new Error('No section anchor') }
  return {type: 'section', anchor: result.anchor, item: text(id)}
}

function itemAddition(id: string, sections: ContractSection[], target: string, position: 'before' | 'after'): ContractAddition {
  const result = anchorAt(sections, target, position)
  if (result?.type !== 'list-item') { throw new Error('No list item anchor') }
  return {type: 'list-item', anchor: result.anchor, item: item(id)}
}
