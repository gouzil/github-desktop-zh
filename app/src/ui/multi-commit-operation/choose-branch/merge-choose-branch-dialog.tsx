import React from 'react'
import { getAheadBehind, revSymmetricDifference } from '../../../lib/git'
import { determineMergeability } from '../../../lib/git/merge-tree'
import { promiseWithMinimumTimeout } from '../../../lib/promise'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { MergeTreeResult } from '../../../models/merge'
import { MultiCommitOperationKind } from '../../../models/multi-commit-operation'
import { PopupType } from '../../../models/popup'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { BaseChooseBranchDialog } from './base-choose-branch-dialog'

export class MergeChooseBranchDialog extends BaseChooseBranchDialog {
  private commitCount: number = 0
  private mergeStatus: MergeTreeResult | null = null

  protected start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch } = this.state
    const { operation, dispatcher, repository } = this.props
    if (!selectedBranch) {
      return
    }

    dispatcher.mergeBranch(
      repository,
      selectedBranch,
      this.mergeStatus,
      operation === MultiCommitOperationKind.Squash
    )
    this.props.dispatcher.closePopup(PopupType.MultiCommitOperation)
  }

  protected canStart = (): boolean => {
    const selectedBranch = this.state.selectedBranch
    const currentBranch = this.props.currentBranch

    const selectedBranchIsCurrentBranch =
      selectedBranch !== null &&
      currentBranch !== null &&
      selectedBranch.name === currentBranch.name

    const isBehind = this.commitCount !== undefined && this.commitCount > 0

    const canMergeBranch =
      this.mergeStatus === null ||
      this.mergeStatus.kind !== ComputedAction.Invalid

    return (
      selectedBranch !== null &&
      !selectedBranchIsCurrentBranch &&
      isBehind &&
      canMergeBranch
    )
  }

  protected onSelectionChanged = async (selectedBranch: Branch | null) => {
    if (selectedBranch != null) {
      this.setState({ selectedBranch })
      return this.updateStatus(selectedBranch)
    }

    // return to empty state
    this.setState({ selectedBranch })
    this.commitCount = 0
    this.mergeStatus = null
  }

  protected renderActionStatusIcon = () => {
    return (
      <ActionStatusIcon
        status={this.mergeStatus}
        classNamePrefix="merge-status"
      />
    )
  }

  protected getDialogTitle = (branchName: string) => {
    const squashPrefix =
      this.props.operation === MultiCommitOperationKind.Squash
        ? '压缩和 '
        : null
    return (
      <>
        {squashPrefix}合并到 <strong>{branchName}</strong>
      </>
    )
  }

  protected updateStatus = async (branch: Branch) => {
    const { currentBranch, repository } = this.props
    this.mergeStatus = { kind: ComputedAction.Loading }
    this.updateMergeStatusPreview(branch)

    if (currentBranch != null) {
      this.mergeStatus = await promiseWithMinimumTimeout(
        () => determineMergeability(repository, currentBranch, branch),
        500
      ).catch<MergeTreeResult>(e => {
        log.error('Failed determining mergeability', e)
        return { kind: ComputedAction.Clean }
      })

      this.updateMergeStatusPreview(branch)
    }

    const range = revSymmetricDifference('', branch.name)
    const aheadBehind = await getAheadBehind(this.props.repository, range)
    this.commitCount = aheadBehind ? aheadBehind.behind : 0

    if (this.state.selectedBranch !== branch) {
      this.commitCount = 0
    }

    this.updateMergeStatusPreview(branch)
  }

  private updateMergeStatusPreview(branch: Branch) {
    this.setState({ statusPreview: this.getMergeStatusPreview(branch) })
  }

  private getMergeStatusPreview(branch: Branch): JSX.Element | null {
    const { currentBranch } = this.props

    if (this.mergeStatus === null) {
      return null
    }

    if (this.mergeStatus.kind === ComputedAction.Loading) {
      return this.renderLoadingMergeMessage()
    }

    if (this.mergeStatus.kind === ComputedAction.Clean) {
      return this.renderCleanMergeMessage(
        branch,
        currentBranch,
        this.commitCount
      )
    }

    if (this.mergeStatus.kind === ComputedAction.Invalid) {
      return this.renderInvalidMergeMessage()
    }

    return this.renderConflictedMergeMessage(
      branch,
      currentBranch,
      this.mergeStatus.conflictedFiles
    )
  }

  private renderLoadingMergeMessage() {
    return <React.Fragment>正在检查自动合并的能力...</React.Fragment>
  }

  private renderCleanMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    commitCount: number
  ) {
    if (commitCount === 0) {
      return (
        <React.Fragment>
          {`此分支是最新的 `}
          <strong>{branch.name}</strong>
        </React.Fragment>
      )
    }

    const pluralized = commitCount === 1 ? '提交' : '提交'
    return (
      <React.Fragment>
        这将合并
        <strong>{` ${commitCount} ${pluralized}`}</strong>
        {` 从 `}
        <strong>{branch.name}</strong>
        {` 到 `}
        <strong>{currentBranch.name}</strong>
      </React.Fragment>
    )
  }

  private renderInvalidMergeMessage() {
    return <React.Fragment>无法合并此存储库中不相关的历史记录</React.Fragment>
  }

  private renderConflictedMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    count: number
  ) {
    const pluralized = count === 1 ? '文件' : '文件'
    return (
      <React.Fragment>
        将会有
        <strong>{` ${count} 冲突的 ${pluralized}`}</strong>
        {` 合并时从 `}
        <strong>{branch.name}</strong>
        {` 到 `}
        <strong>{currentBranch.name}</strong>
      </React.Fragment>
    )
  }
}
