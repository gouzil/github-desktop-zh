import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'

interface IConfirmAbortDialogProps {
  /**
   * This is expected to be capitalized for correct output on windows and macOs.
   *
   * Examples:
   *  - Rebase
   *  - Cherry-pick
   *  - Squash
   */
  readonly operation: string
  readonly onReturnToConflicts: () => void
  readonly onConfirmAbort: () => Promise<void>
}

interface IConfirmAbortDialogState {
  readonly isAborting: boolean
}

export class ConfirmAbortDialog extends React.Component<
  IConfirmAbortDialogProps,
  IConfirmAbortDialogState
> {
  public constructor(props: IConfirmAbortDialogProps) {
    super(props)
    this.state = {
      isAborting: false,
    }
  }

  private onSubmit = async () => {
    this.setState({
      isAborting: true,
    })

    await this.props.onConfirmAbort()

    this.setState({
      isAborting: false,
    })
  }

  private onCancel = async () => {
    return this.props.onReturnToConflicts()
  }

  public render() {
    const { operation } = this.props
    return (
      <Dialog
        id="abort-warning"
        title={
          __DARWIN__
            ? `确认中止 ${operation}`
            : `确认中止 ${operation.toLowerCase()}`
        }
        onDismissed={this.onCancel}
        onSubmit={this.onSubmit}
        disabled={this.state.isAborting}
        type="warning"
      >
        <DialogContent>
          <div className="column-left">
            <p>您确定要取消吗 {operation.toLowerCase()}?</p>
            <p>这将使您回到最初的分支状态，已经解决的冲突将被丢弃.</p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? `中止 ${operation}`
                : `中止 ${operation.toLowerCase()}`
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
