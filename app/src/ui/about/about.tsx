import * as React from 'react'

import { Row } from '../lib/row'
import { Button } from '../lib/button'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { updateStore, IUpdateState, UpdateStatus } from '../lib/update-store'
import { Disposable } from 'event-kit'
import { Loading } from '../lib/loading'
import { RelativeTime } from '../relative-time'
import { assertNever } from '../../lib/fatal-error'
import { ReleaseNotesUri } from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'

const logoPath = __DARWIN__
  ? 'static/logo-64x64@2x.png'
  : 'static/windows-logo-64x64@2x.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  /** A function to call to kick off an update check. */
  readonly onCheckForUpdates: () => void

  /** A function to call to kick off a non-staggered update check. */
  readonly onCheckForNonStaggeredUpdates: () => void

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void
}

interface IAboutState {
  readonly updateState: IUpdateState
  readonly altKeyPressed: boolean
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
export class About extends React.Component<IAboutProps, IAboutState> {
  private updateStoreEventHandle: Disposable | null = null

  public constructor(props: IAboutProps) {
    super(props)

    this.state = {
      updateState: updateStore.state,
      altKeyPressed: false,
    }
  }

  private onUpdateStateChanged = (updateState: IUpdateState) => {
    this.setState({ updateState })
  }

  public componentDidMount() {
    this.updateStoreEventHandle = updateStore.onDidChange(
      this.onUpdateStateChanged
    )
    this.setState({ updateState: updateStore.state })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  public componentWillUnmount() {
    if (this.updateStoreEventHandle) {
      this.updateStoreEventHandle.dispose()
      this.updateStoreEventHandle = null
    }
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      this.setState({ altKeyPressed: true })
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      this.setState({ altKeyPressed: false })
    }
  }

  private onQuitAndInstall = () => {
    updateStore.quitAndInstallUpdate()
  }

  private renderUpdateButton() {
    if (__RELEASE_CHANNEL__ === 'development') {
      return null
    }

    const updateStatus = this.state.updateState.status

    switch (updateStatus) {
      case UpdateStatus.UpdateReady:
        return (
          <Row>
            <Button onClick={this.onQuitAndInstall}>退出并安装更新</Button>
          </Row>
        )
      case UpdateStatus.UpdateNotAvailable:
      case UpdateStatus.CheckingForUpdates:
      case UpdateStatus.UpdateAvailable:
      case UpdateStatus.UpdateNotChecked:
        const disabled = ![
          UpdateStatus.UpdateNotChecked,
          UpdateStatus.UpdateNotAvailable,
        ].includes(updateStatus)

        const onClick = this.state.altKeyPressed
          ? this.props.onCheckForNonStaggeredUpdates
          : this.props.onCheckForUpdates

        const buttonTitle = this.state.altKeyPressed
          ? '确保最新版本'
          : '检查更新'

        const tooltip = this.state.altKeyPressed
          ? "GitHub Desktop可能会逐步向我们的用户群发布更新, 以确保我们及早发现任何问题。这允许您绕过之前的版本, 直接跳到最新版本(如果有)."
          : ''

        return (
          <Row>
            <Button disabled={disabled} onClick={onClick} tooltip={tooltip}>
              {buttonTitle}
            </Button>
          </Row>
        )
      default:
        return assertNever(updateStatus, `未知更新状态 ${updateStatus}`)
    }
  }

  private renderCheckingForUpdate() {
    return (
      <Row className="update-status">
        <Loading />
        <span>查询更新…</span>
      </Row>
    )
  }

  private renderUpdateAvailable() {
    return (
      <Row className="update-status">
        <Loading />
        <span>下载更新…</span>
      </Row>
    )
  }

  private renderUpdateNotAvailable() {
    const lastCheckedDate = this.state.updateState.lastSuccessfulCheck

    // This case is rendered as an error
    if (!lastCheckedDate) {
      return null
    }

    return (
      <p className="update-status">
        您有最新版本 (但是！但是！但是！更新后将失去翻译) (last checked{' '}
        <RelativeTime date={lastCheckedDate} />)
      </p>
    )
  }

  private renderUpdateReady() {
    return <p className="update-status">已下载更新并准备安装。</p>
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return null
    }

    if (__RELEASE_CHANNEL__ === 'development') {
      return <p>该应用程序目前正在开发中，不会 收到任何更新。</p>
    }

    const updateState = this.state.updateState

    switch (updateState.status) {
      case UpdateStatus.CheckingForUpdates:
        return this.renderCheckingForUpdate()
      case UpdateStatus.UpdateAvailable:
        return this.renderUpdateAvailable()
      case UpdateStatus.UpdateNotAvailable:
        return this.renderUpdateNotAvailable()
      case UpdateStatus.UpdateReady:
        return this.renderUpdateReady()
      case UpdateStatus.UpdateNotChecked:
        return null
      default:
        return assertNever(
          updateState.status,
          `未知更新状态 ${updateState.status}`
        )
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    if (__RELEASE_CHANNEL__ === 'development') {
      return null
    }

    if (!this.state.updateState.lastSuccessfulCheck) {
      return (
        <DialogError>
          无法确定上次执行更新检查的时间。您 可能运行的是旧版本。请尝试手动检查
          如果问题仍然存在, 请更新并联系GitHub支持人员
        </DialogError>
      )
    }

    return null
  }

  private renderBetaLink() {
    if (__RELEASE_CHANNEL__ === 'beta') {
      return
    }

    return (
      <div>
        <p className="no-padding">正在查找最新功能?</p>
        <p className="no-padding">
          查看{' '}
          <LinkButton uri="https://desktop.github.com/beta">
            Beta频道
          </LinkButton>
        </p>
      </div>
    )
  }

  public render() {
    const name = this.props.applicationName
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <LinkButton uri={ReleaseNotesUri}>发行说明</LinkButton>
    )

    const versionText = __DEV__ ? `Build ${version}` : `Version ${version}`

    return (
      <Dialog
        id="about"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img
              src={DesktopLogo}
              alt="GitHub Desktop"
              width="64"
              height="64"
            />
          </Row>
          <h2>{name}</h2>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>{' '}
            ({releaseNotesLink})
          </p>
          <p className="no-padding">
            <LinkButton onClick={this.props.onShowTermsAndConditions}>
              条款和条件
            </LinkButton>
          </p>
          <p>
            <LinkButton onClick={this.props.onShowAcknowledgements}>
              许可证和开源声明
            </LinkButton>
          </p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          {this.renderBetaLink()}
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
