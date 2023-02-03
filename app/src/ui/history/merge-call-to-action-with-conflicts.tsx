import * as React from 'react'

import { HistoryTabMode } from '../../lib/app-state'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dispatcher } from '../dispatcher'
import { ActionStatusIcon } from '../lib/action-status-icon'
import { MergeTreeResult } from '../../models/merge'
import { ComputedAction } from '../../models/computed-action'
import {
  DropdownSelectButton,
  IDropdownSelectButtonOption,
} from '../dropdown-select-button'
import { getMergeOptions, updateRebasePreview } from '../lib/update-branch'
import { MultiCommitOperationKind } from '../../models/multi-commit-operation'
import { RebasePreview } from '../../models/rebase'

interface IMergeCallToActionWithConflictsProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly mergeStatus: MergeTreeResult | null
  readonly currentBranch: Branch
  readonly comparisonBranch: Branch
  readonly commitsBehind: number
}

interface IMergeCallToActionWithConflictsState {
  readonly selectedOperation: MultiCommitOperationKind
  readonly rebasePreview: RebasePreview | null
}

export class MergeCallToActionWithConflicts extends React.Component<
  IMergeCallToActionWithConflictsProps,
  IMergeCallToActionWithConflictsState
> {
  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get computedAction(): ComputedAction | null {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return this.state.rebasePreview !== null
        ? this.state.rebasePreview.kind
        : null
    }
    return this.props.mergeStatus !== null ? this.props.mergeStatus.kind : null
  }

  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get commitCount(): number {
    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return rebasePreview !== null &&
        rebasePreview.kind === ComputedAction.Clean
        ? rebasePreview.commits.length
        : 0
    }

    return this.props.commitsBehind
  }

  public constructor(props: IMergeCallToActionWithConflictsProps) {
    super(props)

    this.state = {
      selectedOperation: MultiCommitOperationKind.Merge,
      rebasePreview: null,
    }
  }

  private isUpdateBranchDisabled(): boolean {
    if (this.commitCount <= 0) {
      return true
    }

    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        rebasePreview === null || rebasePreview.kind !== ComputedAction.Clean
      )
    }

    return (
      this.props.mergeStatus != null &&
      this.props.mergeStatus.kind === ComputedAction.Invalid
    )
  }

  private updateRebasePreview = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private onOperationChange = (
    option: IDropdownSelectButtonOption<MultiCommitOperationKind>
  ) => {
    this.setState({ selectedOperation: option.value })
    if (option.value === MultiCommitOperationKind.Rebase) {
      this.updateRebasePreview(this.props.comparisonBranch)
    }
  }

  private onOperationInvoked = async (
    event: React.MouseEvent<HTMLButtonElement>,
    selectedOption: IDropdownSelectButtonOption<MultiCommitOperationKind>
  ) => {
    event.preventDefault()

    const { dispatcher, repository } = this.props

    await this.dispatchOperation(selectedOption.value)

    dispatcher.executeCompare(repository, {
      kind: HistoryTabMode.History,
    })

    dispatcher.updateCompareForm(repository, {
      showBranchList: false,
      filterText: '',
    })
  }

  private async dispatchOperation(
    operation: MultiCommitOperationKind
  ): Promise<void> {
    const {
      dispatcher,
      currentBranch,
      comparisonBranch,
      repository,
      mergeStatus,
    } = this.props

    if (operation === MultiCommitOperationKind.Rebase) {
      const commits =
        this.state.rebasePreview !== null &&
        this.state.rebasePreview.kind === ComputedAction.Clean
          ? this.state.rebasePreview.commits
          : []
      return dispatcher.startRebase(
        repository,
        comparisonBranch,
        currentBranch,
        commits
      )
    }

    const isSquash = operation === MultiCommitOperationKind.Squash
    dispatcher.initializeMultiCommitOperation(
      repository,
      {
        kind: MultiCommitOperationKind.Merge,
        isSquash,
        sourceBranch: comparisonBranch,
      },
      currentBranch,
      [],
      currentBranch.tip.sha
    )
    dispatcher.recordCompareInitiatedMerge()

    return dispatcher.mergeBranch(
      repository,
      comparisonBranch,
      mergeStatus,
      isSquash
    )
  }

  public render() {
    const disabled = this.isUpdateBranchDisabled()
    const mergeDetails = this.commitCount > 0 ? this.renderMergeStatus() : null

    return (
      <div className="merge-cta">
        {mergeDetails}

        <DropdownSelectButton
          selectedValue={this.state.selectedOperation}
          options={getMergeOptions()}
          disabled={disabled}
          onSelectChange={this.onOperationChange}
          onSubmit={this.onOperationInvoked}
        />
      </div>
    )
  }

  private renderMergeStatus() {
    if (this.computedAction === null) {
      return null
    }

    return (
      <div className="merge-status-component">
        <ActionStatusIcon
          status={{ kind: this.computedAction }}
          classNamePrefix="merge-status"
        />

        {this.renderStatusDetails()}
      </div>
    )
  }

  private renderStatusDetails() {
    const { currentBranch, comparisonBranch, mergeStatus } = this.props
    const { selectedOperation } = this.state
    if (this.computedAction === null) {
      return null
    }
    switch (this.computedAction) {
      case ComputedAction.Loading:
        return this.renderLoadingMessage()
      case ComputedAction.Clean:
        return this.renderCleanMessage(currentBranch, comparisonBranch)
      case ComputedAction.Invalid:
        return this.renderInvalidMessage()
    }

    if (
      selectedOperation !== MultiCommitOperationKind.Rebase &&
      mergeStatus !== null &&
      mergeStatus.kind === ComputedAction.Conflicts
    ) {
      return this.renderConflictedMergeMessage(
        currentBranch,
        comparisonBranch,
        mergeStatus.conflictedFiles
      )
    }
    return null
  }

  private renderLoadingMessage() {
    return (
      <div className="merge-message merge-message-loading">
        检查是否能够 {this.state.selectedOperation.toLowerCase()} 自动…
      </div>
    )
  }

  private renderCleanMessage(currentBranch: Branch, branch: Branch) {
    if (this.commitCount <= 0) {
      return null
    }

    const pluralized = this.commitCount === 1 ? '提交' : '提交'

    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          这将更新 <strong>{currentBranch.name}</strong>
          {` 通过应用 `}
          <strong>{`${this.commitCount} ${pluralized}`}</strong>
          {` 的基础上 `}
          <strong>{branch.name}</strong>
        </div>
      )
    }

    return (
      <div className="merge-message">
        这将合并
        <strong>{` ${this.commitCount} ${pluralized}`}</strong>
        {` 从 `}
        <strong>{branch.name}</strong>
        {` 到 `}
        <strong>{currentBranch.name}</strong>
      </div>
    )
  }

  private renderInvalidMessage() {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          无法开始变基. 检查你已经选择了一个有效的分支.
        </div>
      )
    }

    return (
      <div className="merge-message">无法合并此存储库中不相关的历史记录</div>
    )
  }

  private renderConflictedMergeMessage(
    currentBranch: Branch,
    branch: Branch,
    count: number
  ) {
    const pluralized = count === 1 ? 'file' : 'files'
    return (
      <div className="merge-message">
        将会有
        <strong>{` ${count} 冲突 ${pluralized}`}</strong>
        {` 合并时 `}
        <strong>{branch.name}</strong>
        {` 到 `}
        <strong>{currentBranch.name}</strong>
      </div>
    )
  }
}
