import * as React from 'react'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { Banner } from './banner'
import { LinkButton } from '../lib/link-button'
import { setNumber } from '../../lib/local-storage'

export const UnsupportedOSBannerDismissedAtKey =
  'unsupported-os-banner-dismissed-at'

export class WindowsVersionNoLongerSupportedBanner extends React.Component<{
  onDismissed: () => void
}> {
  private onDismissed = () => {
    setNumber(UnsupportedOSBannerDismissedAtKey, Date.now())
    this.props.onDismissed()
  }

  public render() {
    return (
      <Banner
        id="conflicts-found-banner"
        dismissable={true}
        onDismissed={this.onDismissed}
      >
        <Octicon className="alert-icon" symbol={OcticonSymbol.alert} />
        <div className="banner-message">
          <span>不再支持此操作系统。软件更新已禁用</span>
          <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
            支持详细信息
          </LinkButton>
        </div>
      </Banner>
    )
  }
}
