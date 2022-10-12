import React from 'react'
import { parseRepositoryIdentifier } from '../../lib/remote-parsing'
import { ISubmoduleDiff } from '../../models/diff'
import { LinkButton } from '../lib/link-button'
import { TooltippedCommitSHA } from '../lib/tooltipped-commit-sha'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'

type SubmoduleItemIcon =
  | {
      readonly octicon: typeof OcticonSymbol.info
      readonly className: 'info-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffModified
      readonly className: 'modified-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffAdded
      readonly className: 'added-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffRemoved
      readonly className: 'removed-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.fileDiff
      readonly className: 'untracked-icon'
    }

interface ISubmoduleDiffProps {
  readonly onOpenSubmodule?: (fullPath: string) => void
  readonly diff: ISubmoduleDiff

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's content can be committed, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean
}

export class SubmoduleDiff extends React.Component<ISubmoduleDiffProps> {
  public constructor(props: ISubmoduleDiffProps) {
    super(props)
  }

  public render() {
    return (
      <div className="changes-interstitial submodule-diff">
        <div className="content">
          <div className="interstitial-header">
            <div className="text">
              <h1>子模块更改</h1>
            </div>
          </div>
          {this.renderSubmoduleInfo()}
          {this.renderCommitChangeInfo()}
          {this.renderSubmodulesChangesInfo()}
          {this.renderOpenSubmoduleAction()}
        </div>
      </div>
    )
  }

  private renderSubmoduleInfo() {
    if (this.props.diff.url === null) {
      return null
    }

    const repoIdentifier = parseRepositoryIdentifier(this.props.diff.url)
    if (repoIdentifier === null) {
      return null
    }

    const hostname =
      repoIdentifier.hostname === 'github.com'
        ? ''
        : ` (${repoIdentifier.hostname})`

    return this.renderSubmoduleDiffItem(
      { octicon: OcticonSymbol.info, className: 'info-icon' },
      <>
        这是基于存储库的子模块{' '}
        <LinkButton
          uri={`https://${repoIdentifier.hostname}/${repoIdentifier.owner}/${repoIdentifier.name}`}
        >
          {repoIdentifier.owner}/{repoIdentifier.name}
          {hostname}
        </LinkButton>
        .
      </>
    )
  }

  private renderCommitChangeInfo() {
    const { diff, readOnly } = this.props
    const { oldSHA, newSHA } = diff

    const verb = readOnly ? 'was' : 'has been'
    const suffix = readOnly ? '' : ' 此更改可以提交到父存储库.'

    if (oldSHA !== null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffModified, className: 'modified-icon' },
        <>
          此子模块将其提交从 {this.renderTooltippedCommitSHA(oldSHA)} 到{' '}
          {this.renderTooltippedCommitSHA(newSHA)}.{suffix}
        </>
      )
    } else if (oldSHA === null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffAdded, className: 'added-icon' },
        <>
          此子模块 {verb} 在提交时添加了指向{' '}
          {this.renderTooltippedCommitSHA(newSHA)}.{suffix}
        </>
      )
    } else if (oldSHA !== null && newSHA === null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffRemoved, className: 'removed-icon' },
        <>
          此子模块 {verb} 当它指向提交时被删除{' '}
          {this.renderTooltippedCommitSHA(oldSHA)}.{suffix}
        </>
      )
    }

    return null
  }

  private renderTooltippedCommitSHA(sha: string) {
    return <TooltippedCommitSHA commit={sha} asRef={true} />
  }

  private renderSubmodulesChangesInfo() {
    const { diff } = this.props

    if (!diff.status.untrackedChanges && !diff.status.modifiedChanges) {
      return null
    }

    const changes =
      diff.status.untrackedChanges && diff.status.modifiedChanges
        ? 'modified and untracked'
        : diff.status.untrackedChanges
        ? 'untracked'
        : 'modified'

    return this.renderSubmoduleDiffItem(
      { octicon: OcticonSymbol.fileDiff, className: 'untracked-icon' },
      <>
        此子模块具有 {changes} 变化.
        这些更改必须在子模块内部提交，然后才能成为父存储库的一部分.
      </>
    )
  }

  private renderSubmoduleDiffItem(
    icon: SubmoduleItemIcon,
    content: React.ReactElement
  ) {
    return (
      <div className="item">
        <Octicon symbol={icon.octicon} className={icon.className} />
        <div className="content">{content}</div>
      </div>
    )
  }

  private renderOpenSubmoduleAction() {
    // If no url is found for the submodule, it means it can't be opened
    // This happens if the user is looking at an old commit which references
    // a submodule that got later deleted.
    if (this.props.diff.url === null) {
      return null
    }

    return (
      <span>
        <SuggestedAction
          title="在 GitHub Desktop 上打开此子模块"
          description="您可以在 GitHub Desktop 上作为普通存储库打开此子模块, 以管理和提交其中的任何更改."
          buttonText={__DARWIN__ ? '打开存储库' : '打开存储库'}
          type="primary"
          onClick={this.onOpenSubmoduleClick}
        />
      </span>
    )
  }

  private onOpenSubmoduleClick = () => {
    this.props.onOpenSubmodule?.(this.props.diff.fullPath)
  }
}
