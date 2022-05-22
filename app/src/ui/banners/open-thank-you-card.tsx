import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { RichText } from '../lib/rich-text'
import { Banner } from './banner'

interface IOpenThankYouCardProps {
  readonly emoji: Map<string, string>
  readonly onDismissed: () => void
  readonly onOpenCard: () => void
  readonly onThrowCardAway: () => void
}

/**
 * A component which tells the user that there is a thank you card for them.
 */
export class OpenThankYouCard extends React.Component<
  IOpenThankYouCardProps,
  {}
> {
  public render() {
    return (
      <Banner id="open-thank-you-card" onDismissed={this.props.onDismissed}>
        <span onSubmit={this.props.onOpenCard}>
          Github Desktop团队非常感谢您的贡献.{' '}
          <LinkButton onClick={this.props.onOpenCard}>打开您的卡片</LinkButton>{' '}
          <RichText
            className="thank-you-banner-emoji"
            text={':tada:'}
            emoji={this.props.emoji}
            renderUrlsAsLinks={true}
          />
          或者 <LinkButton onClick={this.onThrowCardAway}>把它扔掉</LinkButton>{' '}
          <RichText
            className="thank-you-banner-emoji"
            text={':sob:'}
            emoji={this.props.emoji}
            renderUrlsAsLinks={true}
          />
        </span>
      </Banner>
    )
  }

  private onThrowCardAway = () => {
    this.props.onDismissed()
    this.props.onThrowCardAway()
  }
}
