import _ from 'lodash'
import React, { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ViewMode } from '../enums'
import { DataViewOptions } from '../models'
import { readData } from '../functions'

import 'ag-grid-community/styles/ag-grid.css' // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css' // Optional Theme applied to the Data Grid

function toJsonView(data) {
  return (
    <div className="overflow-auto h-full">
      <pre>{JSON.stringify(data, (key, value) => (value instanceof Set ? [...value] : value), 2)}</pre>
    </div>
  )
}

function toAgGridInput(data, columnCustomizer) {
  const extracted = readData(data)
  const { objects, fieldDefs } = extracted
  const colDefs = Object.entries(fieldDefs).map(([field, fieldDef]) => {
    let colDef = { field }
    if (columnCustomizer) {
      colDef = columnCustomizer(colDef)
    }
    return colDef
  })
  return {
    ...extracted,
    rowData: objects,
    colDefs
  }
}

export function DataView({
  data,
  viewMode,
  minDepth,
  viewOptions,
  columnCustomizer
}: {
  data: any
  viewMode: ViewMode
  minDepth: number
}) {
  // console.log('[DataView]', { data, viewMode, minDepth })
  const obj = _.isObjectLike(data)
  if (!obj) {
    return obj?.toString()
  }
  if (viewMode === ViewMode.JSON) {
    return toJsonView(data)
  } else {
    if (obj && minDepth === 1) {
      const sections = Object.entries(data).map(([key, value]) => {
        return (
          <div key={key} className="space-y-1">
            <div>{key}</div>
            <DataView
              data={value}
              viewMode={viewMode}
              minDepth={minDepth - 1}
              columnCustomizer={columnCustomizer}
              {...viewOptions}
            />
          </div>
        )
      })
      return <div className="mt-4 space-y-4 overflow-auto h-full">{sections}</div>
    }
    const { rowData, colDefs, values } = toAgGridInput(data, columnCustomizer)
    return (
      <div className="overflow-auto h-full">
        {values.length > 0 && values.join(', ')}
        {rowData.length > 0 && (
          <div className="ag-theme-quartz">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout={'autoHeight'} {...viewOptions} />
          </div>
        )}
      </div>
    )
  }
}
