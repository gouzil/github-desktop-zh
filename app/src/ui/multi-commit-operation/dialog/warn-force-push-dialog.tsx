import * as React from 'react'
import { Checkbox, CheckboxValue } from '../../lib/checkbox'
import { Dispatcher } from '../../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'

interface IWarnForcePushProps {
  /**
   * This is expected to be capitalized for correct output on windows and macOs.
   *
   * Examples:
   *  - Rebase
   *  - Squash
   *  - Reorder
   *  - Amend
   */
  readonly operation: string
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnForcePush: boolean
  readonly onBegin: () => void
  readonly onDismissed: () => void
}

interface IWarnForcePushState {
  readonly askForConfirmationOnForcePush: boolean
}

export class WarnForcePushDialog extends React.Component<
  IWarnForcePushProps,
  IWarnForcePushState
> {
  public constructor(props: IWarnForcePushProps) {
    super(props)

    this.state = {
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    const { operation, onDismissed } = this.props

    const title = __DARWIN__ ? `${operation} 强制推送` : `${operation} 强制推送`

    return (
      <Dialog
        title={title}
        onDismissed={onDismissed}
        onSubmit={this.onBegin}
        dismissable={false}
        type="warning"
      >
        <DialogContent>
          <p>是否确实要 {operation.toLowerCase()}?</p>
          <p>
            在 {operation.toLowerCase()} 流之后, GitHub Desktop
            将使您能够强制推送分支以更新上游分支.
            强制推送将改变远程上的历史记录,
            并可能给在此分支上协作的其他人带来问题.
          </p>
          <div>
            <Checkbox
              label="不再显示此消息"
              value={
                this.state.askForConfirmationOnForcePush
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskForConfirmationOnForcePushChanged}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={`开始 ${
              __DARWIN__ ? operation : operation.toLowerCase()
            }`}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onAskForConfirmationOnForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnForcePush: value })
  }

  private onBegin = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )

    this.props.onBegin()
  }
}
