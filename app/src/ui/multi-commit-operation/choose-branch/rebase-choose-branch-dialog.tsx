import React from 'react'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { RebasePreview } from '../../../models/rebase'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { updateRebasePreview } from '../../lib/update-branch'
import { BaseChooseBranchDialog } from './base-choose-branch-dialog'

export abstract class RebaseChooseBranchDialog extends BaseChooseBranchDialog {
  private rebasePreview: RebasePreview | null = null

  protected start = () => {
    const { selectedBranch } = this.state
    const { repository, currentBranch } = this.props
    if (!selectedBranch) {
      return
    }

    if (
      this.rebasePreview === null ||
      this.rebasePreview.kind !== ComputedAction.Clean
    ) {
      return
    }

    if (!this.canStart()) {
      return
    }

    this.props.dispatcher.startRebase(
      repository,
      selectedBranch,
      currentBranch,
      this.rebasePreview.commits
    )
  }

  protected canStart = (): boolean => {
    return (
      this.state.selectedBranch !== null &&
      !this.selectedBranchIsCurrentBranch() &&
      this.selectedBranchIsAheadOfCurrentBranch()
    )
  }

  private selectedBranchIsCurrentBranch() {
    const currentBranch = this.props.currentBranch
    const { selectedBranch } = this.state
    return (
      selectedBranch !== null &&
      currentBranch !== null &&
      selectedBranch.name === currentBranch.name
    )
  }

  private selectedBranchIsAheadOfCurrentBranch() {
    return this.rebasePreview !== null &&
      this.rebasePreview.kind === ComputedAction.Clean
      ? this.rebasePreview.commits.length > 0
      : false
  }

  protected getSubmitButtonToolTip = () => {
    return this.selectedBranchIsCurrentBranch()
      ? '您无法将此分支重新定位到自身'
      : !this.selectedBranchIsAheadOfCurrentBranch()
      ? '当前分支上没有要重设基础的提交'
      : undefined
  }

  protected getDialogTitle = (branchName: string) => {
    return (
      <>
        变基(Rebase) <strong>{branchName}</strong>
      </>
    )
  }

  protected renderActionStatusIcon = () => {
    return (
      <ActionStatusIcon
        status={this.rebasePreview}
        classNamePrefix="merge-status"
      />
    )
  }

  protected updateStatus = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.rebasePreview = rebasePreview
      this.updateRebaseStatusPreview(baseBranch)
    })
  }

  private updateRebaseStatusPreview(baseBranch: Branch) {
    this.setState({ statusPreview: this.getRebaseStatusPreview(baseBranch) })
  }

  private getRebaseStatusPreview(baseBranch: Branch): JSX.Element | null {
    if (this.rebasePreview == null) {
      return null
    }

    const { currentBranch } = this.props

    if (this.rebasePreview.kind === ComputedAction.Loading) {
      return this.renderLoadingRebaseMessage()
    }
    if (this.rebasePreview.kind === ComputedAction.Clean) {
      return this.renderCleanRebaseMessage(
        currentBranch,
        baseBranch,
        this.rebasePreview.commits.length
      )
    }

    if (this.rebasePreview.kind === ComputedAction.Invalid) {
      return this.renderInvalidRebaseMessage()
    }

    return null
  }

  private renderLoadingRebaseMessage() {
    return <>检查自动重设基础的能力…</>
  }

  private renderInvalidRebaseMessage() {
    return <>无法启动重基。检查您是否选择了有效的分支.</>
  }

  private renderCleanRebaseMessage(
    currentBranch: Branch,
    baseBranch: Branch,
    commitsToRebase: number
  ) {
    if (commitsToRebase <= 0) {
      return (
        <>
          此分支是最新的{` `}
          <strong>{currentBranch.name}</strong>
        </>
      )
    }

    const pluralized = commitsToRebase === 1 ? '提交' : '提交'
    return (
      <>
        这将更新 <strong>{currentBranch.name}</strong>
        {` 通过应用在 `}
        <strong>{` ${commitsToRebase} ${pluralized}`}</strong>
        {` 上面 `}
        <strong>{baseBranch.name}</strong>
      </>
    )
  }
}
