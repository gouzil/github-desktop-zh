import * as React from 'react'

import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Branch, StartPoint } from '../../models/branch'
import { Row } from '../lib/row'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'
import {
  VerticalSegmentedControl,
  ISegmentedItem,
} from '../lib/vertical-segmented-control'
import {
  TipState,
  IUnbornRepository,
  IDetachedHead,
  IValidBranch,
} from '../../models/tip'
import { assertNever } from '../../lib/fatal-error'
import { renderBranchNameExistsOnRemoteWarning } from '../lib/branch-name-warnings'
import { getStartPoint } from '../../lib/create-branch'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { startTimer } from '../lib/timing'
import { GitHubRepository } from '../../models/github-repository'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { CommitOneLine } from '../../models/commit'
import { PopupType } from '../../models/popup'
import { RepositorySettingsTab } from '../repository-settings/repository-settings'
import { isRepositoryWithForkedGitHubRepository } from '../../models/repository'

interface ICreateBranchProps {
  readonly repository: Repository
  readonly targetCommit?: CommitOneLine
  readonly upstreamGitHubRepository: GitHubRepository | null
  readonly dispatcher: Dispatcher
  readonly onBranchCreatedFromCommit?: () => void
  readonly onDismissed: () => void
  /**
   * If provided, the branch creation is handled by the given method.
   *
   * It is also responsible for dismissing the popup.
   */
  readonly createBranch?: (
    name: string,
    startPoint: string | null,
    noTrack: boolean
  ) => void
  readonly tip: IUnbornRepository | IDetachedHead | IValidBranch
  readonly defaultBranch: Branch | null
  readonly upstreamDefaultBranch: Branch | null
  readonly allBranches: ReadonlyArray<Branch>
  readonly initialName: string
  /**
   * If provided, use as the okButtonText
   */
  readonly okButtonText?: string

  /**
   * If provided, use as the header
   */
  readonly headerText?: string
}

interface ICreateBranchState {
  readonly currentError: Error | null
  readonly branchName: string
  readonly startPoint: StartPoint

  /**
   * Whether or not the dialog is currently creating a branch. This affects
   * the dialog loading state as well as the rendering of the branch selector.
   *
   * When the dialog is creating a branch we take the tip and defaultBranch
   * as they were in props at the time of creation and stick them in state
   * so that we can maintain the layout of the branch selection parts even
   * as the Tip changes during creation.
   *
   * Note: once branch creation has been initiated this value stays at true
   * and will never revert to being false. If the branch creation operation
   * fails this dialog will still be dismissed and an error dialog will be
   * shown in its place.
   */
  readonly isCreatingBranch: boolean

  /**
   * The tip of the current repository, captured from props at the start
   * of the create branch operation.
   */
  readonly tipAtCreateStart: IUnbornRepository | IDetachedHead | IValidBranch

  /**
   * The default branch of the current repository, captured from props at the
   * start of the create branch operation.
   */
  readonly defaultBranchAtCreateStart: Branch | null
}

/** The Create Branch component. */
export class CreateBranch extends React.Component<
  ICreateBranchProps,
  ICreateBranchState
> {
  public constructor(props: ICreateBranchProps) {
    super(props)

    const startPoint = getStartPoint(props, StartPoint.UpstreamDefaultBranch)

    this.state = {
      currentError: null,
      branchName: props.initialName,
      startPoint,
      isCreatingBranch: false,
      tipAtCreateStart: props.tip,
      defaultBranchAtCreateStart: getBranchForStartPoint(startPoint, props),
    }
  }

  public componentWillReceiveProps(nextProps: ICreateBranchProps) {
    this.setState({
      startPoint: getStartPoint(nextProps, this.state.startPoint),
    })

    if (!this.state.isCreatingBranch) {
      const defaultStartPoint = getStartPoint(
        nextProps,
        StartPoint.UpstreamDefaultBranch
      )

      this.setState({
        tipAtCreateStart: nextProps.tip,
        defaultBranchAtCreateStart: getBranchForStartPoint(
          defaultStartPoint,
          nextProps
        ),
      })
    }
  }

  private renderBranchSelection() {
    const tip = this.state.isCreatingBranch
      ? this.state.tipAtCreateStart
      : this.props.tip

    const tipKind = tip.kind
    const targetCommit = this.props.targetCommit

    if (targetCommit !== undefined) {
      return (
        <p>
          Your new branch will be based on the commit '{targetCommit.summary}' (
          {targetCommit.sha.substring(0, 7)}) from your repository.
        </p>
      )
    } else if (tip.kind === TipState.Detached) {
      return (
        <p>
          You do not currently have any branch checked out (your HEAD reference
          is detached). As such your new branch will be based on your currently
          checked out commit ({tip.currentSha.substring(0, 7)}
          ).
        </p>
      )
    } else if (tip.kind === TipState.Unborn) {
      return (
        <p>
          Your current branch is unborn (does not contain any commits). Creating
          a new branch will rename the current branch.
        </p>
      )
    } else if (tip.kind === TipState.Valid) {
      if (
        this.props.upstreamGitHubRepository !== null &&
        this.props.upstreamDefaultBranch !== null
      ) {
        return this.renderForkBranchSelection(
          tip.branch.name,
          this.props.upstreamDefaultBranch,
          this.props.upstreamGitHubRepository.fullName
        )
      }

      const defaultBranch = this.state.isCreatingBranch
        ? this.props.defaultBranch
        : this.state.defaultBranchAtCreateStart

      return this.renderRegularBranchSelection(tip.branch.name, defaultBranch)
    } else {
      return assertNever(tip, `Unknown tip kind ${tipKind}`)
    }
  }

  private onBaseBranchChanged = (startPoint: StartPoint) => {
    this.setState({
      startPoint,
    })
  }

  public render() {
    const disabled =
      this.state.branchName.length <= 0 ||
      !!this.state.currentError ||
      /^\s*$/.test(this.state.branchName)
    const error = this.state.currentError

    return (
      <Dialog
        id="create-branch"
        title={this.getHeaderText()}
        onSubmit={this.createBranch}
        onDismissed={this.props.onDismissed}
        loading={this.state.isCreatingBranch}
        disabled={this.state.isCreatingBranch}
      >
        {error ? <DialogError>{error.message}</DialogError> : null}

        <DialogContent>
          <RefNameTextBox
            label="Name"
            initialValue={this.props.initialName}
            onValueChange={this.onBranchNameChange}
          />

          {renderBranchNameExistsOnRemoteWarning(
            this.state.branchName,
            this.props.allBranches
          )}

          {this.renderBranchSelection()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getOkButtonText()}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private getHeaderText = (): string => {
    if (this.props.headerText !== undefined) {
      return this.props.headerText
    }

    return __DARWIN__ ? 'Create a Branch' : 'Create a branch'
  }

  private getOkButtonText = (): string => {
    if (this.props.okButtonText !== undefined) {
      return this.props.okButtonText
    }

    return __DARWIN__ ? 'Create Branch' : 'Create branch'
  }

  private onBranchNameChange = (name: string) => {
    this.updateBranchName(name)
  }

  private updateBranchName(branchName: string) {
    const alreadyExists =
      this.props.allBranches.findIndex(b => b.name === branchName) > -1

    const currentError = alreadyExists
      ? new Error(`A branch named ${branchName} already exists`)
      : null

    this.setState({
      branchName,
      currentError,
    })
  }

  private createBranch = async () => {
    const name = this.state.branchName

    let startPoint: string | null = null
    let noTrack = false

    const { defaultBranch, upstreamDefaultBranch, repository } = this.props

    if (this.props.targetCommit !== undefined) {
      startPoint = this.props.targetCommit.sha
    } else if (this.state.startPoint === StartPoint.DefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!defaultBranch) {
        this.setState({
          currentError: new Error('Could not determine the default branch'),
        })
        return
      }

      startPoint = defaultBranch.name
    } else if (this.state.startPoint === StartPoint.UpstreamDefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!upstreamDefaultBranch) {
        this.setState({
          currentError: new Error('Could not determine the default branch'),
        })
        return
      }

      startPoint = upstreamDefaultBranch.name
      noTrack = true
    }

    if (name.length > 0) {
      this.setState({ isCreatingBranch: true })

      // If createBranch is provided, use it instead of dispatcher
      if (this.props.createBranch !== undefined) {
        this.props.createBranch(name, startPoint, noTrack)
        return
      }

      const timer = startTimer('create branch', repository)
      const branch = await this.props.dispatcher.createBranch(
        repository,
        name,
        startPoint,
        noTrack
      )
      timer.done()
      this.props.onDismissed()

      // If the operation was successful and the branch was created from a
      // commit, invoke the callback.
      if (
        branch !== undefined &&
        this.props.targetCommit !== undefined &&
        this.props.onBranchCreatedFromCommit !== undefined
      ) {
        this.props.onBranchCreatedFromCommit()
      }
    }
  }

  /**
   * Render options for a non-fork repository
   *
   * Gives user the option to make a new branch from
   * the default branch.
   */
  private renderRegularBranchSelection(
    currentBranchName: string,
    defaultBranch: Branch | null
  ) {
    if (defaultBranch === null || defaultBranch.name === currentBranchName) {
      return (
        <div>
          Your new branch will be based on your currently checked out branch (
          <Ref>{currentBranchName}</Ref>){this.renderForkLinkSuffix()}.{' '}
          <Ref>{currentBranchName}</Ref> is the {defaultBranchLink} for your
          repository.
        </div>
      )
    } else {
      const items = [
        {
          title: defaultBranch.name,
          description:
            "The default branch in your repository. Pick this to start on something new that's not dependent on your current branch.",
          key: StartPoint.DefaultBranch,
        },
        {
          title: currentBranchName,
          description:
            'The currently checked out branch. Pick this if you need to build on work done on this branch.',
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.DefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch

      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  /**
   * Render options if we're in a fork
   *
   * Gives user the option to make a new branch from
   * the upstream default branch.
   */
  private renderForkBranchSelection(
    currentBranchName: string,
    upstreamDefaultBranch: Branch,
    upstreamRepositoryFullName: string
  ) {
    // we assume here that the upstream and this
    // fork will have the same default branch name
    if (currentBranchName === upstreamDefaultBranch.nameWithoutRemote) {
      return (
        <div>
          Your new branch will be based on{' '}
          <strong>{upstreamRepositoryFullName}</strong>
          's {defaultBranchLink} (
          <Ref>{upstreamDefaultBranch.nameWithoutRemote}</Ref>)
          {this.renderForkLinkSuffix()}.
        </div>
      )
    } else {
      const items = [
        {
          title: upstreamDefaultBranch.name,
          description:
            "The default branch of the upstream repository. Pick this to start on something new that's not dependent on your current branch.",
          key: StartPoint.UpstreamDefaultBranch,
        },
        {
          title: currentBranchName,
          description:
            'The currently checked out branch. Pick this if you need to build on work done on this branch.',
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.UpstreamDefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch
      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  private renderForkLink = () => {
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <div className="secondary-text">
          Your default branch source is determined by your{' '}
          <LinkButton onClick={this.onForkSettingsClick}>
            fork behavior settings
          </LinkButton>
          .
        </div>
      )
    } else {
      return
    }
  }

  private renderForkLinkSuffix = () => {
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <span>
          &nbsp;as determined by your{' '}
          <LinkButton onClick={this.onForkSettingsClick}>
            fork behavior settings
          </LinkButton>
        </span>
      )
    } else {
      return
    }
  }

  /** Shared method for rendering two choices in this component */
  private renderOptions = (
    items: ReadonlyArray<ISegmentedItem<StartPoint>>,
    selectedValue: StartPoint
  ) => (
    <Row>
      <VerticalSegmentedControl
        label="Create branch based on…"
        items={items}
        selectedKey={selectedValue}
        onSelectionChanged={this.onBaseBranchChanged}
      />
    </Row>
  )

  private onForkSettingsClick = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.RepositorySettings,
      repository: this.props.repository,
      initialSelectedTab: RepositorySettingsTab.ForkSettings,
    })
  }
}

/** Reusable snippet */
const defaultBranchLink = (
  <LinkButton uri="https://help.github.com/articles/setting-the-default-branch/">
    default branch
  </LinkButton>
)

/** Given some branches and a start point, return the proper branch */
function getBranchForStartPoint(
  startPoint: StartPoint,
  branchInfo: {
    readonly defaultBranch: Branch | null
    readonly upstreamDefaultBranch: Branch | null
  }
) {
  return startPoint === StartPoint.UpstreamDefaultBranch
    ? branchInfo.upstreamDefaultBranch
    : startPoint === StartPoint.DefaultBranch
    ? branchInfo.defaultBranch
    : null
}
