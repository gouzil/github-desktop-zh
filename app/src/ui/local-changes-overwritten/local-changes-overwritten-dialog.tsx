import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DefaultDialogFooter,
} from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { RetryAction, RetryActionType } from '../../models/retry-actions'
import { Dispatcher } from '../dispatcher'
import { PathText } from '../lib/path-text'
import { assertNever } from '../../lib/fatal-error'

interface ILocalChangesOverwrittenDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  /**
   * Whether there's already a stash entry for the local branch.
   */
  readonly hasExistingStash: boolean
  /**
   * The action that should get executed if the user selects "Stash and Continue".
   */
  readonly retryAction: RetryAction
  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void

  /**
   * The files that prevented the operation from completing, i.e. the files
   * that would be overwritten.
   */
  readonly files: ReadonlyArray<string>
}
interface ILocalChangesOverwrittenDialogState {
  readonly stashingAndRetrying: boolean
}

export class LocalChangesOverwrittenDialog extends React.Component<
  ILocalChangesOverwrittenDialogProps,
  ILocalChangesOverwrittenDialogState
> {
  public constructor(props: ILocalChangesOverwrittenDialogProps) {
    super(props)
    this.state = { stashingAndRetrying: false }
  }

  public render() {
    const overwrittenText =
      this.props.files.length > 0 ? ' 以下文件将被覆盖:' : null

    return (
      <Dialog
        title="错误"
        id="local-changes-overwritten"
        loading={this.state.stashingAndRetrying}
        disabled={this.state.stashingAndRetrying}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
      >
        <DialogContent>
          <p>
            不能 {this.getRetryActionName()} 分支上存在更改时.
            {overwrittenText}
          </p>
          {this.renderFiles()}
          {this.renderStashText()}
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFiles() {
    const { files } = this.props
    if (files.length === 0) {
      return null
    }

    return (
      <div className="files-list">
        <ul>
          {files.map(fileName => (
            <li key={fileName}>
              <PathText path={fileName} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private renderStashText() {
    if (this.props.hasExistingStash && !this.state.stashingAndRetrying) {
      return null
    }

    return <p>您可以现在隐藏更改, 然后恢复更改.</p>
  }

  private renderFooter() {
    if (this.props.hasExistingStash && !this.state.stashingAndRetrying) {
      return <DefaultDialogFooter />
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={__DARWIN__ ? '保存更改并继续' : '保存更改并继续'}
          okButtonTitle="这将为您当前的更改创建一个隐藏. 你可以通过事后恢复库存来恢复它们."
          cancelButtonText="关闭"
        />
      </DialogFooter>
    )
  }

  private onSubmit = async () => {
    const { hasExistingStash, repository, dispatcher, retryAction } = this.props

    if (hasExistingStash) {
      // When there's an existing stash we don't let the user stash the changes
      // and we only show a "Close" button on the modal. In that case, the
      // "Close" button submits the dialog and should only dismiss it.
      this.props.onDismissed()
      return
    }

    this.setState({ stashingAndRetrying: true })

    // We know that there's no stash for the current branch so we can safely
    // tell createStashForCurrentBranch not to show a confirmation dialog which
    // would disrupt the async flow (since you can't await a dialog).
    const createdStash = await dispatcher.createStashForCurrentBranch(
      repository,
      false
    )

    if (createdStash) {
      await dispatcher.performRetry(retryAction)
    }

    this.props.onDismissed()
  }

  /**
   * Returns a user-friendly string to describe the current retryAction.
   */
  private getRetryActionName() {
    switch (this.props.retryAction.type) {
      case RetryActionType.Checkout:
        return 'checkout'
      case RetryActionType.Pull:
        return 'pull'
      case RetryActionType.Merge:
        return 'merge'
      case RetryActionType.Rebase:
        return 'rebase'
      case RetryActionType.Clone:
        return 'clone'
      case RetryActionType.Fetch:
        return 'fetch'
      case RetryActionType.Push:
        return 'push'
      case RetryActionType.CherryPick:
      case RetryActionType.CreateBranchForCherryPick:
        return 'cherry-pick'
      case RetryActionType.Squash:
        return 'squash'
      case RetryActionType.Reorder:
        return 'reorder'
      case RetryActionType.DiscardChanges:
        return 'discard changes'
      default:
        assertNever(
          this.props.retryAction,
          `Unknown retryAction: ${this.props.retryAction}`
        )
    }
  }
}
