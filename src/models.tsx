import { ViewMode, OperationType, CapitalTransactionType } from './enums'
import * as _ from 'lodash'

export class AppEvent {
  id: number
  type: OperationType
  amount?: number
  constructor(args: any) {
    _.merge(this, args)
  }
  applyState(state: AppState) {
    if (this.type === OperationType.Stake) {
      this.stake(state)
    } else if (this.type === OperationType.Redeem) {
      this.redeem(state)
    } else if (this.type === OperationType.RedeemSettle) {
      this.redeemSettle(state)
    }
    state.compute()
  }
  private stake(state: AppState) {
    state.userPosition.stakedAmount += this.amount
  }
  private redeem(state: AppState) {
    const redeemAmount = Math.min(this.amount, state.userPosition.netStakedAmount)
    state.userPosition.redeemAmount += redeemAmount
    const redeemId = state.capitalTransactions.length + 1
    state.capitalTransactions = [
      ...state.capitalTransactions,
      new CapitalTransaction({
        id: redeemId,
        transactionType: CapitalTransactionType.Redeem,
        amount: redeemAmount
      })
    ]
  }
  private redeemSettle(state: AppState) {
    const settleAmount = Math.min(this.amount, state.userPosition.redeemingAmount)
    state.userPosition.redeemedAmount += settleAmount
    const settlementId = state.capitalTransactions.length + 1
    const settlement = new CapitalTransaction({
      id: settlementId,
      transactionType: CapitalTransactionType.RedeemSettle,
      amount: settleAmount
    })
    let remAmount = settleAmount
    for (const tx of state.capitalTransactions) {
      if (tx.transactionType === CapitalTransactionType.Redeem) {
        const redeemNetAmount = tx.netAmount ?? tx.amount
        const fillAmount = Math.min(redeemNetAmount, remAmount)
        if (fillAmount > 0) {
          tx.netAmount = redeemNetAmount - fillAmount
          remAmount -= fillAmount
          state.redemptionSettlementDetails = [
            ...state.redemptionSettlementDetails,
            new RedemptionSettlementDetail({
              id: state.redemptionSettlementDetails.length + 1,
              requestId: tx.id,
              settlementId: settlementId,
              amount: fillAmount
            })
          ]
        }
      }
    }
    settlement.netAmount = remAmount
    state.capitalTransactions = [...state.capitalTransactions, settlement]
  }
}

export class CapitalTransaction {
  id: number
  transactionType: CapitalTransactionType
  amount: number
  netAmount: number

  constructor(args: any) {
    _.merge(this, args)
  }
}

export class UserPosition {
  stakedAmount: number = 0
  redeemAmount: number = 0
  redeemedAmount: number = 0
  netStakedAmount: number = 0
  redeemingAmount: number = 0

  constructor(args: any) {
    _.merge(this, args)
  }
  compute() {
    this.netStakedAmount = this.stakedAmount - this.redeemAmount
    this.redeemingAmount = this.redeemAmount - this.redeemedAmount
  }
}

export class RedemptionSettlementDetail {
  requestId: number
  settlementId: number
  mode: RedeemMode
  amount: number

  constructor(args: any) {
    _.merge(this, args)
  }
}

export class AppState {
  userPosition: UserPosition = new UserPosition()
  capitalTransactions: CapitalTransaction[] = []
  redemptionSettlementDetails: RedemptionSettlementDetail[] = []

  constructor(args: any) {
    _.merge(this, args)
  }
  compute() {
    this.userPosition.compute()
  }
}

export interface AppStateFieldConfig {
  headerText: string
  columnWidth?: number
  value: (AppEventState) => any
}

export interface DataSet {
  name: string
  initState: AppState
  events: AppEvent[]
}

export interface AppStateViewOptions {
  dataSetName: string
  viewMode: ViewMode
}

export interface DataViewOptions {
  viewMode: ViewMode
  minDepth: number
}

export interface SimulationOptions {
  dataSetName: DataSetName
}
