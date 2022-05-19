import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulSquashedBannerProps {
  readonly count: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulSquash extends React.Component<
  ISuccessfulSquashedBannerProps,
  {}
> {
  public render() {
    const { count, onDismissed, onUndo } = this.props

    const pluralized = count === 1 ? '暂存区' : '暂存区'

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          成功制止 {count} {pluralized}.
        </span>
      </SuccessBanner>
    )
  }
}
