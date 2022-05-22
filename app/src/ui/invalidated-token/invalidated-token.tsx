import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Account } from '../../models/account'
import { getDotComAPIEndpoint } from '../../lib/api'

interface IInvalidatedTokenProps {
  readonly dispatcher: Dispatcher
  readonly account: Account
  readonly onDismissed: () => void
}

/**
 * Dialog that alerts user that their GitHub (Enterprise) account token is not
 * valid and they need to sign in again.
 */
export class InvalidatedToken extends React.Component<IInvalidatedTokenProps> {
  public render() {
    const accountTypeSuffix = this.isEnterpriseAccount ? ' Enterprise' : ''

    return (
      <Dialog
        id="invalidated-token"
        type="warning"
        title="Warning"
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            您的帐户令牌已失效, 您已被退出登录 来着您的 GitHub
            {accountTypeSuffix} 账户. 您想要重新登录吗?
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText="Yes" cancelButtonText="No" />
        </DialogFooter>
      </Dialog>
    )
  }

  private get isEnterpriseAccount() {
    return this.props.account.endpoint !== getDotComAPIEndpoint()
  }

  private onSubmit = () => {
    const { dispatcher, onDismissed } = this.props

    onDismissed()

    if (this.isEnterpriseAccount) {
      dispatcher.showEnterpriseSignInDialog(this.props.account.endpoint)
    } else {
      dispatcher.showDotComSignInDialog()
    }
  }
}
