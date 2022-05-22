import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { getDotComAPIEndpoint } from '../../lib/api'
import { RetryAction } from '../../models/retry-actions'

const okButtonText = __DARWIN__ ? 'Continue in Browser' : 'Continue in browser'

interface ISAMLReauthRequiredDialogProps {
  readonly dispatcher: Dispatcher
  readonly organizationName: string
  readonly endpoint: string

  /** The action to retry if applicable. */
  readonly retryAction?: RetryAction

  readonly onDismissed: () => void
}
interface ISAMLReauthRequiredDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a Git network operation is denied due to
 * the organization owning the repository having enforced SAML
 * SSO and the current session not being authorized.
 */
export class SAMLReauthRequiredDialog extends React.Component<
  ISAMLReauthRequiredDialogProps,
  ISAMLReauthRequiredDialogState
> {
  public constructor(props: ISAMLReauthRequiredDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        title={__DARWIN__ ? '需要重新授权' : '需要重新授权'}
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            这个 "{this.props.organizationName}" 组织已启用或强制SAML SSO.
            要访问此存储库, 您必须再次登录并授予GitHub
            Desktop访问组织存储库的权限.
          </p>
          <p>是否打开浏览器以授予GitHub Desktop访问存储库的权限?</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })

    if (this.props.endpoint === getDotComAPIEndpoint()) {
      await this.props.dispatcher.beginDotComSignIn()
    } else {
      await this.props.dispatcher.beginEnterpriseSignIn()
    }
    await this.props.dispatcher.requestBrowserAuthentication()

    if (this.props.retryAction !== undefined) {
      this.props.dispatcher.performRetry(this.props.retryAction)
    }

    this.props.onDismissed()
  }
}
