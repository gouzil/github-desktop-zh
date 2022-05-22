import * as React from 'react'
import { Dispatcher } from '../dispatcher/index'
import { LinkButton } from '../lib/link-button'
import { lastShowCaseVersionSeen, updateStore } from '../lib/update-store'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { PopupType } from '../../models/popup'
import { shell } from '../../lib/app-shell'

import { ReleaseSummary } from '../../models/release-notes'
import { Banner } from './banner'
import { ReleaseNotesUri } from '../lib/releases'
import { RichText } from '../lib/rich-text'

interface IUpdateAvailableProps {
  readonly dispatcher: Dispatcher
  readonly newReleases: ReadonlyArray<ReleaseSummary> | null
  readonly isUpdateShowCaseVisible: boolean
  readonly emoji: Map<string, string>
  readonly onDismissed: () => void
}

/**
 * A component which tells the user an update is available and gives them the
 * option of moving into the future or being a luddite.
 */
export class UpdateAvailable extends React.Component<
  IUpdateAvailableProps,
  {}
> {
  public render() {
    return (
      <Banner id="update-available" onDismissed={this.props.onDismissed}>
        {!this.props.isUpdateShowCaseVisible && (
          <Octicon
            className="download-icon"
            symbol={OcticonSymbol.desktopDownload}
          />
        )}

        {this.renderMessage()}
      </Banner>
    )
  }

  private renderMessage = () => {
    if (this.props.isUpdateShowCaseVisible) {
      const version =
        this.props.newReleases !== null
          ? ` with GitHub Desktop ${this.props.newReleases[0].latestVersion}`
          : ''

      return (
        <span>
          <RichText
            className="banner-emoji"
            text={':tada:'}
            emoji={this.props.emoji}
          />
          添加了令人兴奋的新功能{version}. 看这里{' '}
          <LinkButton onClick={this.showReleaseNotes}>新增功能</LinkButton> 或者{' '}
          <LinkButton onClick={this.dismissUpdateShowCaseVisibility}>
            不考虑
          </LinkButton>
          .
        </span>
      )
    }

    return (
      <span onSubmit={this.updateNow}>
        (有更新的话记得提醒我翻译哈) 已提供并将安装更新版本的GitHub
        Desktop在下次发布时. 看{' '}
        <LinkButton onClick={this.showReleaseNotes}>新功能</LinkButton> 或者{' '}
        <LinkButton onClick={this.updateNow}>重启 GitHub Desktop</LinkButton>.
      </span>
    )
  }

  private dismissUpdateShowCaseVisibility = () => {
    // Note: under that scenario that this is being dismissed due to clicking
    // what's new on a pending release and for some reason we don't have the
    // releases. We will end up showing the showcase banner after restart. This
    // shouldn't happen but even if it did it would just be a minor annoyance as
    // user would need to dismiss it again.
    const versionSeen =
      this.props.newReleases === null
        ? __APP_VERSION__
        : this.props.newReleases[0].latestVersion

    localStorage.setItem(lastShowCaseVersionSeen, versionSeen)
    this.props.dispatcher.setUpdateShowCaseVisibility(false)
  }

  private showReleaseNotes = () => {
    if (this.props.newReleases == null) {
      // if, for some reason we're not able to render the release notes we
      // should redirect the user to the website so we do _something_
      shell.openExternal(ReleaseNotesUri)
    } else {
      this.props.dispatcher.showPopup({
        type: PopupType.ReleaseNotes,
        newReleases: this.props.newReleases,
      })
    }

    this.dismissUpdateShowCaseVisibility()
  }

  private updateNow = () => {
    updateStore.quitAndInstallUpdate()
  }
}
