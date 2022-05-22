import * as React from 'react'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { RebaseConflictState } from '../../lib/app-state'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { WorkingDirectoryStatus } from '../../models/status'
import { getConflictedFiles } from '../../lib/status'
import { MultiCommitOperationKind } from '../../models/multi-commit-operation'

interface IContinueRebaseProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly workingDirectory: WorkingDirectoryStatus
  readonly rebaseConflictState: RebaseConflictState
  readonly isCommitting: boolean
  readonly hasUntrackedChanges: boolean
}

export class ContinueRebase extends React.Component<IContinueRebaseProps, {}> {
  private onSubmit = async () => {
    const { rebaseConflictState } = this.props

    await this.props.dispatcher.continueRebase(
      MultiCommitOperationKind.Rebase,
      this.props.repository,
      this.props.workingDirectory,
      rebaseConflictState
    )
  }

  public render() {
    const { manualResolutions } = this.props.rebaseConflictState

    let canCommit = true
    let tooltip = 'Continue rebase'

    const conflictedFilesCount = getConflictedFiles(
      this.props.workingDirectory,
      manualResolutions
    ).length

    if (conflictedFilesCount > 0) {
      tooltip = 'Resolve all conflicts before continuing'
      canCommit = false
    }

    const buttonEnabled = canCommit && !this.props.isCommitting

    const loading = this.props.isCommitting ? <Loading /> : undefined

    const warnAboutUntrackedFiles = this.props.hasUntrackedChanges ? (
      <div className="warning-untracked-files">
        Untracked files will be excluded
      </div>
    ) : undefined

    return (
      <div id="continue-rebase">
        <Button
          type="submit"
          className="commit-button"
          onClick={this.onSubmit}
          disabled={!buttonEnabled}
          tooltip={tooltip}
        >
          {loading}
          <span>{loading !== undefined ? 'Rebasing' : 'Continue rebase'}</span>
        </Button>

        {warnAboutUntrackedFiles}
      </div>
    )
  }
}
