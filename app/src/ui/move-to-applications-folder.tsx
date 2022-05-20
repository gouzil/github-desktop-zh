import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from './dialog'
import { Dispatcher } from './dispatcher'
import { Checkbox, CheckboxValue } from './lib/checkbox'

interface IMoveToApplicationsFolderProps {
  readonly dispatcher: Dispatcher

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IMoveToApplicationsFolderState {
  readonly askToMoveToApplicationsFolder: boolean
}

export class MoveToApplicationsFolder extends React.Component<
  IMoveToApplicationsFolderProps,
  IMoveToApplicationsFolderState
> {
  public constructor(props: IMoveToApplicationsFolderProps) {
    super(props)
    this.state = {
      askToMoveToApplicationsFolder: true,
    }
  }

  public render() {
    return (
      <Dialog
        title="将GitHub桌面移动到Applications文件夹?"
        id="move-to-applications-folder"
        dismissable={false}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="warning"
      >
        <DialogContent>
          <p>
            我们检测到您没有从计算机的应用程序文件夹中运行GitHub Desktop。
            这可能会导致应用程序出现问题, 包括影响您的登录能力。
            <br />
            <br />
            是否立即将GitHub桌面移动到应用程序文件夹?
            这也将重新启动应用程序.
          </p>
          <div>
            <Checkbox
              label="不再显示此消息"
              value={
                this.state.askToMoveToApplicationsFolder
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskToMoveToApplicationsFolderChanged}
            />
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText="移动并重新启动"
          okButtonTitle="这会将GitHub Desktop移动到计算机中的Applications文件夹, 然后重新启动应用程序."
          cancelButtonText="不是现在"
          onCancelButtonClick={this.onNotNow}
        />
      </DialogFooter>
    )
  }

  private onAskToMoveToApplicationsFolderChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askToMoveToApplicationsFolder: value })
  }

  private onNotNow = () => {
    this.props.onDismissed()
    this.props.dispatcher.setAskToMoveToApplicationsFolderSetting(
      this.state.askToMoveToApplicationsFolder
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    try {
      await this.props.dispatcher.moveToApplicationsFolder()
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
