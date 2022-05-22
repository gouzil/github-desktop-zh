import * as React from 'react'

import { Repository } from '../../models/repository'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmForcePushProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly upstreamBranch: string
  readonly askForConfirmationOnForcePush: boolean
  readonly onDismissed: () => void
}

interface IConfirmForcePushState {
  readonly isLoading: boolean
  readonly askForConfirmationOnForcePush: boolean
}

export class ConfirmForcePush extends React.Component<
  IConfirmForcePushProps,
  IConfirmForcePushState
> {
  public constructor(props: IConfirmForcePushProps) {
    super(props)

    this.state = {
      isLoading: false,
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    return (
      <Dialog
        title="是否确实要强制推送?"
        dismissable={!this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onForcePush}
        type="warning"
      >
        <DialogContent>
          <p>
            强制推送将重写 <Ref>{this.props.upstreamBranch}</Ref> 上的历史.
            在此分支上工作的任何协作者都需要重置自己的本地分支,
            以匹配远程分支的历史记录.
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
          <OkCancelButtonGroup destructive={true} okButtonText="我相信" />
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

  private onForcePush = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )
    this.props.onDismissed()

    await this.props.dispatcher.performForcePush(this.props.repository)
  }
}
