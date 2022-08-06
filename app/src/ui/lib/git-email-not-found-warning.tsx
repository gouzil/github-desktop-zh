import * as React from 'react'
import { Account } from '../../models/account'
import { LinkButton } from './link-button'
import { getDotComAPIEndpoint } from '../../lib/api'
import { isAttributableEmailFor } from '../../lib/email'

interface IGitEmailNotFoundWarningProps {
  /** The account the commit should be attributed to. */
  readonly accounts: ReadonlyArray<Account>

  /** The email address used in the commit author info. */
  readonly email: string
}

/**
 * A component which just displays a warning to the user if their git config
 * email doesn't match any of the emails in their GitHub (Enterprise) account.
 */
export class GitEmailNotFoundWarning extends React.Component<IGitEmailNotFoundWarningProps> {
  public render() {
    const { accounts, email } = this.props

    if (
      accounts.length === 0 ||
      accounts.some(account => isAttributableEmailFor(account, email))
    ) {
      return null
    }

    return (
      <div className="git-email-not-found-warning">
        <span className="warning-icon">⚠️</span> 此电子邮件地址不匹配{' '}
        {this.getAccountTypeDescription()}, 所以你的行为将被错误归因.{' '}
        <LinkButton uri="https://docs.github.com/en/github/committing-changes-to-your-project/why-are-my-commits-linked-to-the-wrong-user">
          查看更多.
        </LinkButton>
      </div>
    )
  }

  private getAccountTypeDescription() {
    if (this.props.accounts.length === 1) {
      const accountType =
        this.props.accounts[0].endpoint === getDotComAPIEndpoint()
          ? 'GitHub'
          : 'GitHub 企业'

      return `你的 ${accountType} 账户`
    }

    return '你的GitHub.com或GitHub企业帐户'
  }
}
