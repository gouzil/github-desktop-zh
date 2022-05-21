import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { getDotComAPIEndpoint } from '../../lib/api'

const okButtonText = __DARWIN__ ? '在浏览器中继续' : '在浏览器中继续'

interface IWorkflowPushRejectedDialogProps {
  readonly rejectedPath: string
  readonly repository: RepositoryWithGitHubRepository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}
interface IWorkflowPushRejectedDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a push is rejected due to it modifying a
 * workflow file without the workflow oauth scope.
 */
export class WorkflowPushRejectedDialog extends React.Component<
  IWorkflowPushRejectedDialogProps,
  IWorkflowPushRejectedDialogState
> {
  public constructor(props: IWorkflowPushRejectedDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        id="workflow-push-rejected"
        title={__DARWIN__ ? '推送被拒绝' : '推送被拒绝'}
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            由于包含对工作流文件的修改, 
            推送被服务器拒绝 <Ref>{this.props.rejectedPath}</Ref>. 
            为了能够推送工作流文件, GitHub Desktop需要请求其他权限.
          </p>
          <p>
            是否打开浏览器以授予 GitHub Desktop更新工作流文件的权限?
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })

    const { repository, dispatcher } = this.props
    const { endpoint } = repository.gitHubRepository

    if (endpoint === getDotComAPIEndpoint()) {
      await dispatcher.beginDotComSignIn()
    } else {
      await dispatcher.beginEnterpriseSignIn()
      await dispatcher.setSignInEndpoint(endpoint)
    }

    await dispatcher.requestBrowserAuthentication()

    dispatcher.push(repository)
    this.props.onDismissed()
  }
}
