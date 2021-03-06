import * as React from 'react'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { Banner } from './banner'

export function BranchAlreadyUpToDate({
  ourBranch,
  theirBranch,
  onDismissed,
}: {
  readonly ourBranch: string
  readonly theirBranch?: string
  readonly onDismissed: () => void
}) {
  const message =
    theirBranch !== undefined ? (
      <span>
        <strong>{ourBranch}</strong>
        {' 已经是最新的 '}
        <strong>{theirBranch}</strong>
      </span>
    ) : (
      <span>
        <strong>{ourBranch}</strong>
        {' 已经是最新的 '}
      </span>
    )

  return (
    <Banner id="successful-merge" timeout={5000} onDismissed={onDismissed}>
      <div className="green-circle">
        <Octicon className="check-icon" symbol={OcticonSymbol.check} />
      </div>
      <div className="banner-message">{message}</div>
    </Banner>
  )
}
