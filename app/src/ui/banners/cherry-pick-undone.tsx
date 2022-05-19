import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ICherryPickUndoneBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
}

export class CherryPickUndone extends React.Component<
  ICherryPickUndoneBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, targetBranchName, onDismissed } = this.props
    const pluralized = countCherryPicked === 1 ? 'commit' : 'commits'
    return (
      <SuccessBanner timeout={5000} onDismissed={onDismissed}>
        废弃筛选. 已成功删除 {countCherryPicked}
        {' copied '}
        {pluralized} 来自 <strong>{targetBranchName}</strong>.
      </SuccessBanner>
    )
  }
}
