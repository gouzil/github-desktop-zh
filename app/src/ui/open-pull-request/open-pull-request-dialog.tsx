import * as React from 'react'
import { IPullRequestState } from '../../lib/app-state'
import { Branch } from '../../models/branch'
import { Repository } from '../../models/repository'
import { DialogFooter, OkCancelButtonGroup, Dialog } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OpenPullRequestDialogHeader } from './open-pull-request-header'

interface IOpenPullRequestDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher

  /**
   * The IRepositoryState.pullRequestState
   */
  readonly pullRequestState: IPullRequestState

  /**
   * The currently checked out branch
   */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /**
   * See IBranchesState.allBranches
   */
  readonly allBranches: ReadonlyArray<Branch>

  /**
   * See IBranchesState.recentBranches
   */
  readonly recentBranches: ReadonlyArray<Branch>

  /** Called to dismiss the dialog */
  readonly onDismissed: () => void
}

/** The component for start a pull request. */
export class OpenPullRequestDialog extends React.Component<IOpenPullRequestDialogProps> {
  private onCreatePullRequest = () => {
    this.props.dispatcher.createPullRequest(this.props.repository)
    // TODO: create pr from dialog pr stat?
    this.props.dispatcher.recordCreatePullRequest()
  }

  private renderHeader() {
    const {
      currentBranch,
      pullRequestState,
      defaultBranch,
      allBranches,
      recentBranches,
    } = this.props
    const { baseBranch, commitSHAs } = pullRequestState
    return (
      <OpenPullRequestDialogHeader
        baseBranch={baseBranch}
        currentBranch={currentBranch}
        defaultBranch={defaultBranch}
        allBranches={allBranches}
        recentBranches={recentBranches}
        commitCount={commitSHAs?.length ?? 0}
        onDismissed={this.props.onDismissed}
      />
    )
  }

  private renderContent() {
    return <div>Content</div>
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText="Create Pull Request"
          okButtonTitle="Create pull request on GitHub."
          cancelButtonText="Cancel"
        />
      </DialogFooter>
    )
  }

  public render() {
    return (
      <Dialog
        className="open-pull-request"
        onSubmit={this.onCreatePullRequest}
        onDismissed={this.props.onDismissed}
      >
        {this.renderHeader()}
        <div className="content">{this.renderContent()}</div>

        {this.renderFooter()}
      </Dialog>
    )
  }
}
