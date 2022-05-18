import * as React from 'react'
import classNames from 'classnames'

import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { RichText } from '../lib/rich-text'
import { Repository } from '../../models/repository'
import { Commit } from '../../models/commit'
import { getAvatarUsersForCommit, IAvatarUser } from '../../models/avatar'
import { AvatarStack } from '../lib/avatar-stack'
import { CommitAttribution } from '../lib/commit-attribution'
import { Tokenizer, TokenResult } from '../../lib/text-token-parser'
import { wrapRichTextCommitMessage } from '../../lib/wrap-rich-text-commit-message'
import { DiffOptions } from '../diff/diff-options'
import { RepositorySectionTab } from '../../lib/app-state'
import { IChangesetData } from '../../lib/git'
import { TooltippedContent } from '../lib/tooltipped-content'
import { clipboard } from 'electron'
import { TooltipDirection } from '../lib/tooltip'
import { AppFileStatusKind } from '../../models/status'

interface ICommitSummaryProps {
  readonly repository: Repository
  readonly commit: Commit
  readonly changesetData: IChangesetData
  readonly emoji: Map<string, string>

  /**
   * Whether or not the commit body container should
   * be rendered expanded or not. In expanded mode the
   * commit body container takes over the diff view
   * allowing for full height, scrollable reading of
   * the commit message body.
   */
  readonly isExpanded: boolean

  readonly onExpandChanged: (isExpanded: boolean) => void

  readonly onDescriptionBottomChanged: (descriptionBottom: Number) => void

  readonly hideDescriptionBorder: boolean

  readonly hideWhitespaceInDiff: boolean

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean
  readonly onHideWhitespaceInDiffChanged: (checked: boolean) => Promise<void>

  /** Called when the user changes the side by side diffs setting. */
  readonly onShowSideBySideDiffChanged: (checked: boolean) => void

  /** Called when the user opens the diff options popover */
  readonly onDiffOptionsOpened: () => void
}

interface ICommitSummaryState {
  /**
   * The commit message summary, i.e. the first line in the commit message.
   * Note that this may differ from the body property in the commit object
   * passed through props, see the createState method for more details.
   */
  readonly summary: ReadonlyArray<TokenResult>

  /**
   * The commit message body, i.e. anything after the first line of text in the
   * commit message. Note that this may differ from the body property in the
   * commit object passed through props, see the createState method for more
   * details.
   */
  readonly body: ReadonlyArray<TokenResult>

  /**
   * Whether or not the commit body text overflows its container. Used in
   * conjunction with the isExpanded prop.
   */
  readonly isOverflowed: boolean

  /**
   * The avatars associated with this commit. Used when rendering
   * the avatar stack and calculated whenever the commit prop changes.
   */
  readonly avatarUsers: ReadonlyArray<IAvatarUser>
}

/**
 * Creates the state object for the CommitSummary component.
 *
 * Ensures that the commit summary never exceeds 72 characters and wraps it
 * into the commit body if it does.
 *
 * @param isOverflowed Whether or not the component should render the commit
 *                     body in expanded mode, see the documentation for the
 *                     isOverflowed state property.
 *
 * @param props        The current commit summary prop object.
 */
function createState(
  isOverflowed: boolean,
  props: ICommitSummaryProps
): ICommitSummaryState {
  const tokenizer = new Tokenizer(props.emoji, props.repository)

  const { summary, body } = wrapRichTextCommitMessage(
    props.commit.summary,
    props.commit.body,
    tokenizer
  )

  const avatarUsers = getAvatarUsersForCommit(
    props.repository.gitHubRepository,
    props.commit
  )

  return { isOverflowed, summary, body, avatarUsers }
}

/**
 * Helper function which determines if two commit objects
 * have the same commit summary and body.
 */
function messageEquals(x: Commit, y: Commit) {
  return x.summary === y.summary && x.body === y.body
}

export class CommitSummary extends React.Component<
  ICommitSummaryProps,
  ICommitSummaryState
> {
  private descriptionScrollViewRef: HTMLDivElement | null = null
  private readonly resizeObserver: ResizeObserver | null = null
  private updateOverflowTimeoutId: NodeJS.Immediate | null = null
  private descriptionRef: HTMLDivElement | null = null

  public constructor(props: ICommitSummaryProps) {
    super(props)

    this.state = createState(false, props)

    const ResizeObserverClass: typeof ResizeObserver = (window as any)
      .ResizeObserver

    if (ResizeObserverClass || false) {
      this.resizeObserver = new ResizeObserverClass(entries => {
        for (const entry of entries) {
          if (entry.target === this.descriptionScrollViewRef) {
            // We might end up causing a recursive update by updating the state
            // when we're reacting to a resize so we'll defer it until after
            // react is done with this frame.
            if (this.updateOverflowTimeoutId !== null) {
              clearImmediate(this.updateOverflowTimeoutId)
            }

            this.updateOverflowTimeoutId = setImmediate(this.onResized)
          }
        }
      })
    }
  }

  private onResized = () => {
    if (this.descriptionRef) {
      const descriptionBottom =
        this.descriptionRef.getBoundingClientRect().bottom
      this.props.onDescriptionBottomChanged(descriptionBottom)
    }

    if (this.props.isExpanded) {
      return
    }

    this.updateOverflow()
  }

  private onDescriptionScrollViewRef = (ref: HTMLDivElement | null) => {
    this.descriptionScrollViewRef = ref

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()

      if (ref) {
        this.resizeObserver.observe(ref)
      } else {
        this.setState({ isOverflowed: false })
      }
    }
  }

  private onDescriptionRef = (ref: HTMLDivElement | null) => {
    this.descriptionRef = ref
  }

  private renderExpander() {
    if (
      !this.state.body.length ||
      (!this.props.isExpanded && !this.state.isOverflowed)
    ) {
      return null
    }

    const expanded = this.props.isExpanded
    const onClick = expanded ? this.onCollapse : this.onExpand
    const icon = expanded ? OcticonSymbol.fold : OcticonSymbol.unfold

    return (
      <a onClick={onClick} className="expander">
        <Octicon symbol={icon} />
        {expanded ? 'Collapse' : 'Expand'}
      </a>
    )
  }

  private onExpand = () => {
    this.props.onExpandChanged(true)
  }

  private onCollapse = () => {
    if (this.descriptionScrollViewRef) {
      this.descriptionScrollViewRef.scrollTop = 0
    }

    this.props.onExpandChanged(false)
  }

  private updateOverflow() {
    const scrollView = this.descriptionScrollViewRef
    if (scrollView) {
      this.setState({
        isOverflowed: scrollView.scrollHeight > scrollView.offsetHeight,
      })
    } else {
      if (this.state.isOverflowed) {
        this.setState({ isOverflowed: false })
      }
    }
  }

  public componentDidMount() {
    // No need to check if it overflows if we're expanded
    if (!this.props.isExpanded) {
      this.updateOverflow()
    }
  }

  public componentWillUpdate(nextProps: ICommitSummaryProps) {
    if (!messageEquals(nextProps.commit, this.props.commit)) {
      this.setState(createState(false, nextProps))
    }
  }

  public componentDidUpdate(
    prevProps: ICommitSummaryProps,
    prevState: ICommitSummaryState
  ) {
    // No need to check if it overflows if we're expanded
    if (!this.props.isExpanded) {
      // If the body has changed or we've just toggled the expanded
      // state we'll recalculate whether we overflow or not.
      if (prevState.body !== this.state.body || prevProps.isExpanded) {
        this.updateOverflow()
      }
    } else {
      // Clear overflow state if we're expanded, we don't need it.
      if (this.state.isOverflowed) {
        this.setState({ isOverflowed: false })
      }
    }
  }

  private renderDescription() {
    if (this.state.body.length === 0) {
      return null
    }

    return (
      <div
        className="commit-summary-description-container"
        ref={this.onDescriptionRef}
      >
        <div
          className="commit-summary-description-scroll-view"
          ref={this.onDescriptionScrollViewRef}
        >
          <RichText
            className="commit-summary-description"
            emoji={this.props.emoji}
            repository={this.props.repository}
            text={this.state.body}
          />
        </div>

        {this.renderExpander()}
      </div>
    )
  }

  public render() {
    const shortSHA = this.props.commit.shortSha

    const className = classNames({
      expanded: this.props.isExpanded,
      collapsed: !this.props.isExpanded,
      'has-expander': this.props.isExpanded || this.state.isOverflowed,
      'hide-description-border': this.props.hideDescriptionBorder,
    })

    const hasEmptySummary = this.state.summary.length === 0
    const commitSummary = hasEmptySummary
      ? 'Empty commit message'
      : this.state.summary

    const summaryClassNames = classNames('commit-summary-title', {
      'empty-summary': hasEmptySummary,
    })

    return (
      <div id="commit-summary" className={className}>
        <div className="commit-summary-header">
          <RichText
            className={summaryClassNames}
            emoji={this.props.emoji}
            repository={this.props.repository}
            text={commitSummary}
          />

          <ul className="commit-summary-meta">
            <li
              className="commit-summary-meta-item without-truncation"
              aria-label="Author"
            >
              <AvatarStack users={this.state.avatarUsers} />
              <CommitAttribution
                gitHubRepository={this.props.repository.gitHubRepository}
                commit={this.props.commit}
              />
            </li>

            <li
              className="commit-summary-meta-item without-truncation"
              aria-label="SHA"
            >
              <Octicon symbol={OcticonSymbol.gitCommit} />
              <TooltippedContent
                className="sha"
                tooltip={this.renderShaTooltip()}
                tooltipClassName="sha-hint"
                interactive={true}
                direction={TooltipDirection.SOUTH}
              >
                {shortSHA}
              </TooltippedContent>
            </li>

            {this.renderChangedFilesDescription()}
            {this.renderLinesChanged()}
            {this.renderTags()}

            <li
              className="commit-summary-meta-item without-truncation"
              title="Diff Options"
            >
              <DiffOptions
                sourceTab={RepositorySectionTab.History}
                hideWhitespaceChanges={this.props.hideWhitespaceInDiff}
                onHideWhitespaceChangesChanged={
                  this.props.onHideWhitespaceInDiffChanged
                }
                showSideBySideDiff={this.props.showSideBySideDiff}
                onShowSideBySideDiffChanged={
                  this.props.onShowSideBySideDiffChanged
                }
                onDiffOptionsOpened={this.props.onDiffOptionsOpened}
              />
            </li>
          </ul>
        </div>

        {this.renderDescription()}
      </div>
    )
  }

  private renderShaTooltip() {
    return (
      <>
        <code>{this.props.commit.sha}</code>
        <button onClick={this.onCopyShaButtonClick}>Copy</button>
      </>
    )
  }

  private onCopyShaButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    clipboard.writeText(this.props.commit.sha)
  }

  private renderChangedFilesDescription = () => {
    const fileCount = this.props.changesetData.files.length
    const filesPlural = fileCount === 1 ? 'file' : 'files'
    const filesShortDescription = `${fileCount} changed ${filesPlural}`

    let filesAdded = 0
    let filesModified = 0
    let filesRemoved = 0
    for (const file of this.props.changesetData.files) {
      switch (file.status.kind) {
        case AppFileStatusKind.New:
          filesAdded += 1
          break
        case AppFileStatusKind.Modified:
          filesModified += 1
          break
        case AppFileStatusKind.Deleted:
          filesRemoved += 1
          break
      }
    }

    const filesLongDescription = (
      <>
        {filesAdded > 0 ? (
          <span>
            <Octicon
              className="files-added-icon"
              symbol={OcticonSymbol.diffAdded}
            />
            {filesAdded} added
          </span>
        ) : null}
        {filesModified > 0 ? (
          <span>
            <Octicon
              className="files-modified-icon"
              symbol={OcticonSymbol.diffModified}
            />
            {filesModified} modified
          </span>
        ) : null}
        {filesRemoved > 0 ? (
          <span>
            <Octicon
              className="files-deleted-icon"
              symbol={OcticonSymbol.diffRemoved}
            />
            {filesRemoved} deleted
          </span>
        ) : null}
      </>
    )

    return (
      <TooltippedContent
        className="commit-summary-meta-item without-truncation"
        tooltipClassName="changed-files-description-tooltip"
        tooltip={fileCount > 0 ? filesLongDescription : undefined}
      >
        <Octicon symbol={OcticonSymbol.diff} />
        {filesShortDescription}
      </TooltippedContent>
    )
  }

  private renderLinesChanged() {
    const linesAdded = this.props.changesetData.linesAdded
    const linesDeleted = this.props.changesetData.linesDeleted
    if (linesAdded + linesDeleted === 0) {
      return null
    }

    const linesAddedPlural = linesAdded === 1 ? 'line' : 'lines'
    const linesDeletedPlural = linesDeleted === 1 ? 'line' : 'lines'
    const linesAddedTitle = `${linesAdded} ${linesAddedPlural} added`
    const linesDeletedTitle = `${linesDeleted} ${linesDeletedPlural} deleted`

    return (
      <>
        <TooltippedContent
          tagName="li"
          className="commit-summary-meta-item without-truncation lines-added"
          tooltip={linesAddedTitle}
        >
          +{linesAdded}
        </TooltippedContent>
        <TooltippedContent
          tagName="li"
          className="commit-summary-meta-item without-truncation lines-deleted"
          tooltip={linesDeletedTitle}
        >
          -{linesDeleted}
        </TooltippedContent>
      </>
    )
  }

  private renderTags() {
    const tags = this.props.commit.tags || []

    if (tags.length === 0) {
      return null
    }

    return (
      <li className="commit-summary-meta-item" title={tags.join('\n')}>
        <span aria-label="Tags">
          <Octicon symbol={OcticonSymbol.tag} />
        </span>

        <span className="tags">{tags.join(', ')}</span>
      </li>
    )
  }
}
