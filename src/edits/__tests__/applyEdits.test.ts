import { describe, expect, it } from 'vitest'
import { ContractSection, ListItem, ListSection } from '../../structure'
import { anchorAt } from '../anchor'
import { applyEdits, invalidEdits } from '../applyEdits'
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
    expect(invalidEdits(sections, [removal('a'), removal('b')])).toEqual([removal('a')])
  })

  it('reports replacements of what is required as invalid', () => {
    const sections = [{...text('a'), required: true}, text('b')]
    const edits = [replacement(sections, 'a', 'A'), replacement(sections, 'b', 'B')]
    expect(invalidEdits(sections, edits)).toEqual([edits[0]])
  })

})

describe('replacements', () => {

  it('replaces a section in place, keeping its conditions', () => {
    const condition = [[{input: 'x', operator: 'not-blank' as const}]]
    const sections = [text('a'), {...text('b'), $if: condition}, text('c')]
    const edit = replacement(sections, 'b', 'B')

    const {sections: result, orphans} = applyEdits(sections, [edit])
    expect(result.map(it => it.id)).toEqual(['a', 'b', 'c'])
    expect(result[1]).toMatchObject({name: 'B', $if: condition})
    expect(orphans).toEqual([])
  })

  it('keeps the sub-items of a replaced list item, and what was done to them', () => {
    const sections = [list('l', [item('1', [item('1.1'), item('1.2')]), item('2')])]
    const edit = {...replacement(sections, '1', null), item: {...item('1'), text: doc('new')}} as ContractEdit

    const {sections: result} = applyEdits(sections, [edit, removal('1.2')])
    expect(itemIds(result[0])).toEqual(['1', '1.1', '2'])
    expect((result[0] as ListSection).items[0].text).toEqual(doc('new'))
  })

  it('falls back to its anchor when what it replaces is gone', () => {
    const sections = [text('a'), text('b'), text('c')]
    const edit = replacement(sections, 'b', 'B')

    const {sections: result} = applyEdits([text('a'), text('c')], [edit])
    expect(result.map(it => it.id)).toEqual(['a', 'b', 'c'])
    expect(result[1]).toMatchObject({name: 'B'})
  })

  it('does not replace what is required', () => {
    const sections = [{...text('a'), required: true}]
    const edit = replacement(sections, 'a', 'A')

    const {sections: result, orphans} = applyEdits(sections, [edit])
    expect(result[0].name).toBeNull()
    expect(orphans).toEqual([edit])
  })

})

function removal(target: string): ContractEdit {
  return {type: 'removal', target}
}

function replacement(sections: ContractSection[], id: string, name: string | null): ContractEdit {
  const result = anchorAt(sections, id, 'after')
  if (result == null) { throw new Error('No anchor') }

  const copy = result.type === 'section' ? {...text(id), name} : item(id)
  return {type: result.type, anchor: result.anchor, item: copy, replaces: true} as ContractEdit
}

function doc(text: string) {
  return {type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text}]}]}
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
