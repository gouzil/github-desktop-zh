import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'

interface IWarnLocalChangesBeforeUndoProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: Commit
  readonly isWorkingDirectoryClean: boolean
  readonly onDismissed: () => void
}

interface IWarnLocalChangesBeforeUndoState {
  readonly isLoading: boolean
}

/**
 * Dialog that alerts user that there are uncommitted changes in the working
 * directory where they are gonna be undoing a commit.
 */
export class WarnLocalChangesBeforeUndo extends React.Component<
  IWarnLocalChangesBeforeUndoProps,
  IWarnLocalChangesBeforeUndoState
> {
  public constructor(props: IWarnLocalChangesBeforeUndoProps) {
    super(props)
    this.state = { isLoading: false }
  }

  public render() {
    const title = __DARWIN__ ? '撤销提交' : '撤销提交'

    return (
      <Dialog
        id="warn-local-changes-before-undo"
        type="warning"
        title={title}
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>{this.getWarningText()}</Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="继续" />
        </DialogFooter>
      </Dialog>
    )
  }

  private getWarningText() {
    if (
      this.props.commit.isMergeCommit &&
      !this.props.isWorkingDirectoryClean
    ) {
      return (
        <>
          您正在进行更改。撤销合并提交可能会导致其中一些更改丢失.
          <br />
          <br />
          {this.getMergeCommitUndoWarningText()}
          <br />
          <br />
          您还想继续吗?
        </>
      )
    } else if (this.props.commit.isMergeCommit) {
      return (
        <>
          {this.getMergeCommitUndoWarningText()}
          <br />
          <br />
          您还想继续吗?
        </>
      )
    } else {
      return (
        <>您正在进行更改. 撤销提交可能会导致其中一些更改丢失. 您还想继续吗?</>
      )
    }
  }

  private getMergeCommitUndoWarningText() {
    return `取消合并提交将把合并中的更改应用到工作目录中,
    再次提交将创建一个全新的提交. 这意味着您将丢失合并提交, 
    因此, 来自合并分支的提交可能会从该分支中消失.`
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      await dispatcher.undoCommit(repository, commit, false)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }
}
