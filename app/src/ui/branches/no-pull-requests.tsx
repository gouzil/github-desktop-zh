import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface INoPullRequestsProps {
  /** The name of the repository. */
  readonly repositoryName: string

  /** Is the default branch currently checked out? */
  readonly isOnDefaultBranch: boolean

  /** Is this component being rendered due to a search? */
  readonly isSearch: boolean

  /* Called when the user wants to create a new branch. */
  readonly onCreateBranch: () => void

  /** Called when the user wants to create a pull request. */
  readonly onCreatePullRequest: () => void

  /** Are we currently loading pull requests? */
  readonly isLoadingPullRequests: boolean
}

/** The placeholder for when there are no open pull requests. */
export class NoPullRequests extends React.Component<INoPullRequestsProps, {}> {
  public render() {
    return (
      <div className="no-pull-requests">
        <img src={BlankSlateImage} className="blankslate-image" />
        {this.renderTitle()}
        {this.renderCallToAction()}
      </div>
    )
  }

  private renderTitle() {
    if (this.props.isSearch) {
      return <div className="title">抱歉, 找不到pull请求!</div>
    } else if (this.props.isLoadingPullRequests) {
      return <div className="title">挂紧(Hang tight)</div>
    } else {
      return (
        <div>
          <div className="title">您都准备好了!</div>
          <div className="no-prs">
            没有打开的拉取(pull)请求 <Ref>{this.props.repositoryName}</Ref>
          </div>
        </div>
      )
    }
  }

  private renderCallToAction() {
    if (this.props.isLoadingPullRequests) {
      return <div className="call-to-action">尽快加载拉取请求!</div>
    }

    if (this.props.isOnDefaultBranch) {
      return (
        <div className="call-to-action">
          您愿意{' '}
          <LinkButton onClick={this.props.onCreateBranch}>
            创建一个新的分支
          </LinkButton>{' '}
          继续您的下一个项目?
        </div>
      )
    } else {
      return (
        <div className="call-to-action">
          您愿意{' '}
          <LinkButton onClick={this.props.onCreatePullRequest}>
            创建拉取请求
          </LinkButton>{' '}
          来自当前分支?
        </div>
      )
    }
  }
}
