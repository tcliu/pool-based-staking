import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { decrement, increment } from './store'
import { AppStateViewOptions, SimulationOptions, DataSet } from '../models'
import { DataSetOption, ViewMode } from '../enums'
import { buildAppStates } from '../functions'
import { DataView } from './data-view'
import { actions } from '../store'
import { AppEvent } from '../models'
import _ from 'lodash'

const { updateDataSets } = actions.data
const { updateOptions } = actions.option
const { updateForms } = actions.form

import { Input, Tabs, Select, Button, Modal, AutoComplete, message } from 'antd'
import type { TabsProps, AutoCompleteProps } from 'antd'
const { TextArea } = Input

export function AppStateView() {
  const dispatch = useDispatch()
  const [messageApi, contextHolder] = message.useMessage()
  const dataSets = useSelector(state => state.data.dataSets)
  const { viewMode, dataSetName, stateIndex } = useSelector(state => state.option)
  const { initState, events } = dataSets[dataSetName]
  const [states, setStates] = useState<AppState[]>([initState])
  const [editing, setEditing] = useState<boolean>(false)

  function updateStateIndex(stateIndex) {
    const idx = (Number(stateIndex) + (stateIndex < 0 ? events.length + 1 : 0)) % (events.length + 1)
    localStorage.setItem('stateIndex', idx)
    dispatch(
      updateOptions({
        stateIndex: idx
      })
    )
  }

  function updateDataSetName(name) {
    dispatch(
      updateOptions({
        dataSetName: name
      })
    )
  }

  function updateViewMode(viewMode) {
    dispatch(
      updateOptions({
        viewMode
      })
    )
  }

  function toggleEdit() {
    setEditing(!editing)
  }

  function refreshStates(events) {
    const states = [initState]
    for (let i = 1; i <= events.length; i++) {
      states[i] = _.cloneDeep(states[i - 1])
      events[i - 1].applyState(states[i])
    }
    setStates(states)
    updateStateIndex(stateIndex)
    console.log('Updated states', states)
  }

  useEffect(() => {
    refreshStates(events)
  }, [dataSetName])

  function AppStateSimulation() {
    const dataSetNameOptions = Object.keys(dataSets).map(key => ({ value: key, label: key }))
    const viewModeOptions = Object.keys(ViewMode).map(key => ({ value: key, label: key }))

    function ControlPanel() {
      function edit(e) {
        setEditing(true)
        dispatch(
          updateForms({
            editEvents: {
              dataSetName,
              content: JSON.stringify(events, null, 2)
            }
          })
        )
      }
      return (
        <div className="flex-none space-x-2">
          <label className="p-1">Data set</label>
          <Select
            className="w-40"
            value={dataSetName}
            onChange={v => updateDataSetName(v)}
            options={dataSetNameOptions}
          />
          <label className="p-1">Event</label>
          <Input className="w-24" type="number" value={stateIndex} onChange={e => updateStateIndex(e.target.value)} />
          <label className="p-1">View</label>
          <Select className="w-40" value={viewMode} onChange={v => updateViewMode(v)} options={viewModeOptions} />
          <Button onClick={edit}>Edit</Button>
        </div>
      )
    }

    function DataPanel() {
      const widths = {
        id: 50,
        amount: 80,
        redeemingAmount: 130
      }
      const viewOptions = {}
      const columnCustomizer = viewId => colDef => {
        const { field } = colDef
        const width = widths[field] || 120
        const cellClass = params => {
          if (viewId === 'event' && params.rowIndex === stateIndex - 1) {
            return 'bg-yellow-100'
          }
        }
        return { ...colDef, width, cellClass }
      }
      return (
        <div className="flex flex-auto flex-row space-x-2 h-full">
          <div className="flex flex-initial flex-col p-2 overflow-auto border rounded min-w-[400px]">
            <div className="text-lg font-bold">Events</div>
            <DataView
              data={events}
              viewMode={viewMode}
              viewOptions={viewOptions}
              columnCustomizer={columnCustomizer('event')}
            />
          </div>
          <div className="flex flex-initial flex-col p-2 overflow-auto border rounded w-full">
            <div className="text-lg font-bold">State</div>
            <DataView
              data={states[stateIndex]}
              viewMode={viewMode}
              minDepth={1}
              viewOptions={viewOptions}
              columnCustomizer={columnCustomizer('state')}
            />
          </div>
        </div>
      )
    }

    function EditEventsModal() {
      const { dataSetName: editEventsDataSetName, content: editEventsContent } =
        useSelector(state => state.form.editEvents) ?? {}

      function _updateDataSetName(dataSetName) {
        if (_.isArray(dataSetName)) {
          dataSetName = dataSetName[0]
        }
        const { events = [] } = dataSets[dataSetName] ?? {}
        dispatch(
          updateForms({
            editEvents: {
              dataSetName,
              content: JSON.stringify(events, null, 2)
            }
          })
        )
      }
      function _updateContent(content) {
        dispatch(
          updateForms({
            editEvents: {
              content
            }
          })
        )
      }

      function executeSaveEvents() {
        let newEvents
        try {
          newEvents = JSON.parse(editEventsContent).map(cfg => new AppEvent(cfg))
        } catch (e) {
          messageApi.error(e.message)
          return
        }
        const updates = {
          [editEventsDataSetName]: {
            ...dataSets[dataSetName],
            events: newEvents
          }
        }
        dispatch(updateDataSets(updates))
        refreshStates(newEvents)
        toggleEdit()
      }
      const [dataSetNameOptions, setDataSetNameOptions] = useState<AutoCompleteProps['options']>([])
      function _searchDataSetNames(text) {
        const opts = Object.keys(dataSets).filter(key => !text || key.toLowerCase().indexOf(text.toLowerCase()) !== -1)
        setDataSetNameOptions(
          opts.map(value => ({
            value
          }))
        )
        _updateDataSetName(text)
      }

      return (
        <Modal
          title="Save Events"
          open={editing}
          onOk={executeSaveEvents}
          onCancel={toggleEdit}
          maskClosable={false}
          width={600}>
          <div className="space-y-2">
            <div className="space-x-2">
              <label>Data Set</label>
              <AutoComplete
                value={editEventsDataSetName}
                options={dataSetNameOptions}
                className="w-52"
                onSelect={_updateDataSetName}
                onSearch={_searchDataSetNames}
              />
            </div>
            <div>
              <label>Event JSON</label>
              <TextArea
                className="font-mono"
                rows={12}
                value={editEventsContent}
                onChange={e => _updateContent(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )
    }

    return (
      <div className="p-2 space-y-2 h-lvh flex flex-col">
        <ControlPanel />
        <DataPanel />
        {editing && <EditEventsModal />}
        {contextHolder}
      </div>
    )
  }

  return <AppStateSimulation />
}
