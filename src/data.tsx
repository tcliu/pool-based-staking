import _ from 'lodash'
import { ViewMode, OperationType } from './enums'
import { AppEvent, AppState, AppStateViewOptions, DataSet } from './models'
import { toAppEvents } from './functions'

const initState = new AppState({})

const basicEventCsv = `
type,amount,count
Stake,3,
Stake,5,
Redeem,2,
Redeem,4,
RedeemSettle,5,
Stake,6,
Redeem,5,
RedeemSettle,4,
RedeemSettle,2,
`
const advancedEventCsv = `
type,amount,count
Stake,100,
Redeem,1,
Redeem,2,
Redeem,3,
Redeem,4,
RedeemSettle,5,
Redeem,6,
Redeem,7,
Redeem,8,
Redeem,9,
RedeemSettle,10,
RedeemSettle,11,
RedeemSettle,12,
RedeemSettle,2,
`

const repeatedEventCsv = `
type,amount,count
Stake,45,1
Redeem,1,3
Redeem,2,3
Redeem,3,3
Redeem,4,3
Redeem,5,3
RedeemSettle,9,5
`

const eventCsvs = {
  Basic: basicEventCsv,
  Advanced: advancedEventCsv,
  Repeated: repeatedEventCsv
}

export const dataSets = _.mapValues(eventCsvs, (v, name) => {
  return {
    initState,
    events: toAppEvents(v)
  }
})
