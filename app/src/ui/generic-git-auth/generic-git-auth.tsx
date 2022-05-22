import * as React from 'react'

import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { RetryAction } from '../../models/retry-actions'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'

interface IGenericGitAuthenticationProps {
  /** The hostname with which the user tried to authenticate. */
  readonly hostname: string

  /** The function to call when the user saves their credentials. */
  readonly onSave: (
    hostname: string,
    username: string,
    password: string,
    retryAction: RetryAction
  ) => void

  /** The function to call when the user dismisses the dialog. */
  readonly onDismiss: () => void

  /** The action to retry after getting credentials. */
  readonly retryAction: RetryAction
}

interface IGenericGitAuthenticationState {
  readonly username: string
  readonly password: string
}

/** Shown to enter the credentials to authenticate to a generic git server. */
export class GenericGitAuthentication extends React.Component<
  IGenericGitAuthenticationProps,
  IGenericGitAuthenticationState
> {
  public constructor(props: IGenericGitAuthenticationProps) {
    super(props)

    this.state = { username: '', password: '' }
  }

  public render() {
    const disabled = !this.state.password.length || !this.state.username.length
    return (
      <Dialog
        id="generic-git-auth"
        title={__DARWIN__ ? `身份验证失败` : `身份验证失败`}
        onDismissed={this.props.onDismiss}
        onSubmit={this.save}
      >
        <DialogContent>
          <p>
            我们无法通过验证 <Ref>{this.props.hostname}</Ref>.
            请输入用户名和密码以重试.
          </p>

          <Row>
            <TextBox
              label="用户名"
              autoFocus={true}
              value={this.state.username}
              onValueChanged={this.onUsernameChange}
            />
          </Row>

          <Row>
            <TextBox
              label="密码"
              type="password"
              value={this.state.password}
              onValueChanged={this.onPasswordChange}
            />
          </Row>

          <Row>
            <div>
              根据存储库的托管服务，您可能需要使用个人访问令牌(PAT)作为密码。
              了解关于创建PAT的更多信息{' '}
              <LinkButton uri="https://github.com/desktop/desktop/tree/development/docs/integrations">
                文档
              </LinkButton>
              .
            </div>
          </Row>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '保存并重试' : '保存并重试'}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUsernameChange = (value: string) => {
    this.setState({ username: value })
  }

  private onPasswordChange = (value: string) => {
    this.setState({ password: value })
  }

  private save = () => {
    this.props.onDismiss()

    this.props.onSave(
      this.props.hostname,
      this.state.username,
      this.state.password,
      this.props.retryAction
    )
  }
}
