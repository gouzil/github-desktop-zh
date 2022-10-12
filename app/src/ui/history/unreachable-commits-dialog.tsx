import * as React from 'react'
import { Dialog, DialogFooter } from '../dialog'
import { TabBar } from '../tab-bar'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'
import { CommitList } from './commit-list'
import { LinkButton } from '../lib/link-button'

export enum UnreachableCommitsTab {
  Unreachable,
  Reachable,
}

interface IUnreachableCommitsDialogProps {
  /** The shas of the currently selected commits */
  readonly selectedShas: ReadonlyArray<string>

  /** The shas of the commits showed in the diff */
  readonly shasInDiff: ReadonlyArray<string>

  /** The commits loaded, keyed by their full SHA. */
  readonly commitLookup: Map<string, Commit>

  /** Used to set the selected tab. */
  readonly selectedTab: UnreachableCommitsTab

  /** The emoji lookup to render images inline */
  readonly emoji: Map<string, string>

  /** Called to dismiss the  */
  readonly onDismissed: () => void
}

interface IUnreachableCommitsDialogState {
  /** The currently select tab. */
  readonly selectedTab: UnreachableCommitsTab
}

/** The component for for viewing the unreachable commits in the current diff a repository. */
export class UnreachableCommitsDialog extends React.Component<
  IUnreachableCommitsDialogProps,
  IUnreachableCommitsDialogState
> {
  public constructor(props: IUnreachableCommitsDialogProps) {
    super(props)

    this.state = {
      selectedTab: props.selectedTab,
    }
  }

  public componentWillUpdate(nextProps: IUnreachableCommitsDialogProps) {
    const currentSelectedTab = this.props.selectedTab
    const selectedTab = nextProps.selectedTab

    if (currentSelectedTab !== selectedTab) {
      this.setState({ selectedTab })
    }
  }

  private onTabClicked = (selectedTab: UnreachableCommitsTab) => {
    this.setState({ selectedTab })
  }

  private getShasToDisplay = () => {
    const { selectedTab } = this.state
    const { shasInDiff, selectedShas } = this.props
    if (selectedTab === UnreachableCommitsTab.Reachable) {
      return shasInDiff
    }

    return selectedShas.filter(sha => !shasInDiff.includes(sha))
  }

  private renderTabs() {
    return (
      <TabBar
        onTabClicked={this.onTabClicked}
        selectedIndex={this.state.selectedTab}
      >
        <span>不可达到</span>
        <span>可达到</span>
      </TabBar>
    )
  }

  private renderActiveTab() {
    const { commitLookup, emoji } = this.props

    return (
      <>
        {this.renderUnreachableCommitsMessage()}
        <div className="unreachable-commit-list">
          <CommitList
            gitHubRepository={null}
            isLocalRepository={true}
            commitLookup={commitLookup}
            commitSHAs={this.getShasToDisplay()}
            selectedSHAs={[]}
            localCommitSHAs={[]}
            emoji={emoji}
          />
        </div>
      </>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup cancelButtonVisible={false} />
      </DialogFooter>
    )
  }

  private renderUnreachableCommitsMessage = () => {
    const count = this.getShasToDisplay().length
    const commitsPluralized = count > 1 ? '承诺' : '承诺'
    const pronounPluralized = count > 1 ? `它们是` : `它是`
    return (
      <div className="message">
        你将{' '}
        {this.state.selectedTab === UnreachableCommitsTab.Unreachable
          ? 'not'
          : ''}{' '}
        请参阅以下更改: {commitsPluralized} 因为 {pronounPluralized}{' '}
        {this.state.selectedTab === UnreachableCommitsTab.Unreachable
          ? 'not'
          : ''}{' '}
        在您的选择中最近提交的祖先路径中.{' '}
        <LinkButton uri="https://github.com/desktop/desktop/blob/development/docs/learn-more/unreachable-commits.md">
          了解更多信息.
        </LinkButton>
      </div>
    )
  }

  public render() {
    return (
      <Dialog
        className="unreachable-commits"
        title={__DARWIN__ ? '提交可达性' : '提交可达性'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderTabs()}
        {this.renderActiveTab()}
        {this.renderFooter()}
      </Dialog>
    )
  }
}
