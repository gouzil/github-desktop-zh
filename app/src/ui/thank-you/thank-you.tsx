/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import * as React from 'react'
import { DesktopFakeRepository } from '../../lib/desktop-fake-repository'
import {
  ReleaseNoteHeaderLeftUri,
  ReleaseNoteHeaderRightUri,
} from '../../lib/release-notes'
import { ReleaseNote } from '../../models/release-notes'
import { Dialog, DialogContent } from '../dialog'
import { RichText } from '../lib/rich-text'

interface IThankYouProps {
  readonly onDismissed: () => void
  readonly emoji: Map<string, string>
  readonly userContributions: ReadonlyArray<ReleaseNote>
  readonly friendlyName: string
  readonly latestVersion: string | null
}

export class ThankYou extends React.Component<IThankYouProps, {}> {
  private renderList(
    releaseEntries: ReadonlyArray<ReleaseNote>
  ): JSX.Element | null {
    if (releaseEntries.length === 0) {
      return null
    }

    const options = new Array<JSX.Element>()

    for (const [i, entry] of releaseEntries.entries()) {
      options.push(
        <li key={i}>
          <RichText
            text={entry.message}
            emoji={this.props.emoji}
            renderUrlsAsLinks={true}
            repository={DesktopFakeRepository}
          />
        </li>
      )
    }

    return (
      <div className="section">
        <ul className="entries">{options}</ul>
      </div>
    )
  }

  private renderConfetti(): JSX.Element | null {
    const confetti = new Array<JSX.Element>()

    const howMuchConfetti = 750
    for (let i = 0; i < howMuchConfetti; i++) {
      confetti.push(<div key={i} className="confetti"></div>)
    }

    return <>{confetti}</>
  }

  public render() {
    const dialogHeader = (
      <div className="release-notes-header">
        <div className="header-graphics">
          <img
            className="release-note-graphic-left"
            src={ReleaseNoteHeaderLeftUri}
            alt=""
          />
          <div className="img-space"></div>
          <img
            className="release-note-graphic-right"
            src={ReleaseNoteHeaderRightUri}
            alt=""
          />
        </div>
        <div className="title">
          <div className="thank-you">
            谢谢你 {this.props.friendlyName}!{' '}
            <RichText
              text={':tada:'}
              emoji={this.props.emoji}
              renderUrlsAsLinks={true}
            />
          </div>
        </div>
      </div>
    )

    const version =
      this.props.latestVersion !== null ? ` ${this.props.latestVersion}` : ''
    const thankYouNote = (
      <>
        非常感谢你在 GitHub Desktop{version}. 我们非常感谢您愿意贡献,
        让应用程序更好地为每个人!
      </>
    )

    return (
      <Dialog
        id="thank-you-notes"
        onDismissed={this.props.onDismissed}
        title={dialogHeader}
      >
        <DialogContent>
          <div className="container">
            <div className="thank-you-note">{thankYouNote}</div>
            <div className="contributions-heading">你的贡献:</div>
            <div className="contributions">
              {this.renderList(this.props.userContributions)}
            </div>
            <div
              className="confetti-container"
              onClick={this.props.onDismissed}
            >
              {this.renderConfetti()}
            </div>
            <div className="footer"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
}
