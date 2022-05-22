import * as React from 'react'
import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { BrowserRedirectMessage } from '../lib/authentication-form'
import { SamplesURL } from '../../lib/stats'

/**
 * The URL to the sign-up page on GitHub.com. Used in conjunction
 * with account actions in the app where the user might want to
 * consider signing up.
 */
export const CreateAccountURL = 'https://github.com/join?source=github-desktop'

interface IStartProps {
  readonly advance: (step: WelcomeStep) => void
  readonly dispatcher: Dispatcher
  readonly loadingBrowserAuth: boolean
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <div id="start">
        <h1 className="welcome-title">欢迎来到 GitHub&nbsp;Desktop</h1>
        {!this.props.loadingBrowserAuth ? (
          <>
            <p className="welcome-text">
              GitHub Desktop是为GitHub和GitHub 企业贡献项目的无缝方式.
              请在下面登录, 以开始您现有的项目.
            </p>
            <p className="welcome-text">
              新的 GitHub?{' '}
              <LinkButton
                uri={CreateAccountURL}
                className="create-account-link"
              >
                创建免费帐户.
              </LinkButton>
            </p>
          </>
        ) : (
          <p>{BrowserRedirectMessage}</p>
        )}

        <div className="welcome-main-buttons">
          <Button
            type="submit"
            className="button-with-icon"
            disabled={this.props.loadingBrowserAuth}
            onClick={this.signInWithBrowser}
          >
            {this.props.loadingBrowserAuth && <Loading />}
            登录到 GitHub.com
            <Octicon symbol={OcticonSymbol.linkExternal} />
          </Button>
          {this.props.loadingBrowserAuth ? (
            <Button onClick={this.cancelBrowserAuth}>Cancel</Button>
          ) : (
            <Button onClick={this.signInToEnterprise}>
              登录到 GitHub 企业
            </Button>
          )}
        </div>
        <div className="skip-action-container">
          <LinkButton className="skip-button" onClick={this.skip}>
            跳过这一步
          </LinkButton>
        </div>
        <div className="welcome-start-disclaimer-container">
          通过创建帐户，您同意{' '}
          <LinkButton uri={'https://github.com/site/terms'}>
            服务条款
          </LinkButton>
          . 有关GitHub隐私实践的更多信息, 请参见{' '}
          <LinkButton uri={'https://github.com/site/privacy'}>
            GitHub隐私声明
          </LinkButton>
          .<br />
          <br />
          GitHub Desktop发送使用指标以改进产品并通知功能决策.
          了解更多有关发送哪些指标以及我们如何使用这些指标的信息{' '}
          <LinkButton uri={SamplesURL}>点击这里</LinkButton>.
        </div>
      </div>
    )
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }

    this.props.advance(WelcomeStep.SignInToDotComWithBrowser)
    this.props.dispatcher.requestBrowserAuthenticationToDotcom()
  }

  private cancelBrowserAuth = () => {
    this.props.advance(WelcomeStep.Start)
  }

  private signInToEnterprise = () => {
    this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    this.props.advance(WelcomeStep.ConfigureGit)
  }
}
