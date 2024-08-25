import _ from 'lodash'
import { parse } from 'csv-parse/sync'
import { AppEvent } from './models'

export function readDataType(data) {
  const isArray = _.isArray(data)
  const isSet = _.isSet(data)
  const isObject = !isArray && !isSet && _.isObject(data)
  const isValue = !isObject && !isArray && !isSet
  return { isObject, isArray, isSet, isValue }
}

export function readData(data) {
  const { isObject, isArray, isSet, isValue } = readDataType(data)
  const fieldDefs = {}
  let items
  if (isArray) {
    items = data
  } else if (isSet) {
    items = [...data]
  } else {
    items = [data]
  }
  const objects = []
  const values = []
  for (const item of items) {
    const { isObject, isArray, isSet, isValue } = readDataType(item)
    if (isObject && !isArray && !isSet) {
      for (const [key, value] of Object.entries(item)) {
        fieldDefs[key] ??= {
          dataType: typeof value
        }
      }
      objects.push(item)
    } else {
      values.push(item)
    }
  }
  const keys = Object.keys(fieldDefs)
  return { objects, values, keys, fieldDefs, isObject, isArray, isSet, isValue }
}

export function toAppEvents(csv): AppEvent[] {
  let id = 1
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }).flatMap((cfg, i) => {
    const { type, amount, count } = cfg
    const events = []
    for (let i = 0; i < (count || 1); i++) {
      const event = new AppEvent({
        id: id++,
        type,
        amount: Number(amount)
      })
      events.push(event)
    }
    return events
  })
}
