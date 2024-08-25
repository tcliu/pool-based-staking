import _ from 'lodash'
import { configureStore, createSlice, getDefaultMiddleware } from '@reduxjs/toolkit'
import { dataSets } from './data'
import { ViewMode } from './enums'
const sliceConfigs = {
  data: {
    initialState: {
      dataSets
    },
    reducers: {
      updateDataSets(state, action) {
        Object.assign(state.dataSets, action.payload)
      }
    }
  },
  form: {
    initialState: {},
    reducers: {
      updateForms(state, action) {
        _.merge(state, action.payload)
        console.log('[updateForms]', action.payload)
      }
    }
  },
  option: {
    initialState: {
      dataSetName: 'Basic',
      viewMode: ViewMode.Grid,
      stateIndex: 0
    },
    reducers: {
      updateOptions(state, action) {
        _.merge(state, action.payload)
      }
    }
  }
}

const slices = _.mapValues(sliceConfigs, (v, name) => {
  const sliceConfig = {
    name,
    ...v
  }
  return createSlice(sliceConfig)
})
const reducer = _.mapValues(slices, (v, name) => v.reducer)
export const actions = _.mapValues(slices, (v, name) => v.actions)

export default configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
