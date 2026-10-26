import { describe, expect, it } from 'vitest'
import { ContractSection, ListItem, ListSection } from '../../structure'
import { anchorAt } from '../anchor'
import { applyEdits, invalidRemovals } from '../applyEdits'
import { ContractEdit } from '../edit'
import { isRemovable } from '../removable'

describe('applyEdits', () => {

  it('removes sections and items', () => {
    const sections = [text('a'), list('l', [item('1', [item('1.1')]), item('2')])]
    const {sections: result, orphans} = applyEdits(sections, [removal('a'), removal('1')])

    expect(result.map(it => it.id)).toEqual(['l'])
    expect(itemIds(result[0])).toEqual(['2'])
    expect(orphans).toEqual([])
  })

  it('keeps an addition in place when what it was added next to is removed', () => {
    const sections = [text('a'), text('b'), text('c')]
    const addition = sectionAddition('x', sections, 'b', 'after')

    const {sections: result} = applyEdits(sections, [addition, removal('b')])
    expect(result.map(it => it.id)).toEqual(['a', 'x', 'c'])
  })

  it('removes additions along with what they were added to', () => {
    const sections = [list('l', [item('1'), item('2')])]
    const addition = itemAddition('x', sections, '1', 'end')

    const {sections: result, orphans} = applyEdits(sections, [addition, removal('1')])
    expect(itemIds(result[0])).toEqual(['2'])
    expect(orphans).toEqual([])
  })

  it('applies removals of items in something that is removed as well', () => {
    const sections = [text('a'), list('l', [item('1')])]
    const edits = [removal('1'), removal('l')]

    const {removed, orphans} = applyEdits(sections, edits)
    expect(removed).toEqual(edits)
    expect(orphans).toEqual([])
  })

  it('returns removals of what is gone as orphans', () => {
    const edits = [removal('x')]
    const {removed, orphans} = applyEdits([text('a')], edits)
    expect(removed).toEqual([])
    expect(orphans).toEqual(edits)
  })

})

describe('isRemovable', () => {

  it('does not allow removing what is required, or what holds something required', () => {
    const sections = [
      {...text('a'), required: true},
      list('l', [item('1', [{...item('1.1'), required: true}]), item('2')]),
    ]

    expect(isRemovable(sections, 'a')).toBe(false)
    expect(isRemovable(sections, 'l')).toBe(false)
    expect(isRemovable(sections, '1')).toBe(false)
    expect(isRemovable(sections, '1.1')).toBe(false)
    expect(isRemovable(sections, '2')).toBe(true)
  })

  it('reports removals of what is required as invalid', () => {
    const sections = [{...text('a'), required: true}, text('b')]
    expect(invalidRemovals(sections, [removal('a'), removal('b')])).toEqual([removal('a')])
  })

})

function removal(target: string): ContractEdit {
  return {type: 'removal', target}
}

function itemIds(section: ContractSection) {
  return ListItem.flatten((section as ListSection).items).map(it => it.item.id)
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

function sectionAddition(id: string, sections: ContractSection[], target: string, position: 'before' | 'after'): ContractEdit {
  const result = anchorAt(sections, target, position)
  if (result?.type !== 'section') { throw new Error('No section anchor') }
  return {type: 'section', anchor: result.anchor, item: text(id)}
}

function itemAddition(id: string, sections: ContractSection[], target: string, position: 'after' | 'end'): ContractEdit {
  const result = anchorAt(sections, target, position)
  if (result?.type !== 'list-item') { throw new Error('No list item anchor') }
  return {type: 'list-item', anchor: result.anchor, item: item(id)}
}
