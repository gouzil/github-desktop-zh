import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { PullRequest, getPullRequestCommitRef } from '../../models/pull-request'
import { Dispatcher } from '../dispatcher'
import { CICheckRunList } from '../check-runs/ci-check-run-list'
import {
  IRefCheck,
  getLatestPRWorkflowRunsLogsForCheckRun,
  getCheckRunActionsWorkflowRuns,
  isFailure,
  getCheckRunStepURL,
} from '../../lib/ci-checks/ci-checks'
import { Account } from '../../models/account'
import { API, IAPIWorkflowJobStep } from '../../lib/api'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { CICheckRunActionsJobStepList } from '../check-runs/ci-check-run-actions-job-step-list'
import { LinkButton } from '../lib/link-button'
import { encodePathAsUrl } from '../../lib/path'
import { PopupType } from '../../models/popup'
import { CICheckReRunButton } from '../check-runs/ci-check-re-run-button'
import { supportsRerunningIndividualOrFailedChecks } from '../../lib/endpoint-capabilities'

const PaperStackImage = encodePathAsUrl(__dirname, 'static/paper-stack.svg')
const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface IPullRequestChecksFailedProps {
  readonly dispatcher: Dispatcher
  readonly shouldChangeRepository: boolean
  readonly accounts: ReadonlyArray<Account>
  readonly repository: RepositoryWithGitHubRepository
  readonly pullRequest: PullRequest
  readonly commitMessage: string
  readonly commitSha: string
  readonly checks: ReadonlyArray<IRefCheck>
  readonly onSubmit: () => void
  readonly onDismissed: () => void
}

interface IPullRequestChecksFailedState {
  readonly switchingToPullRequest: boolean
  readonly selectedCheckID: number
  readonly checks: ReadonlyArray<IRefCheck>
  readonly loadingActionWorkflows: boolean
  readonly loadingActionLogs: boolean
}

/**
 * Dialog to show the result of a CI check run.
 */
export class PullRequestChecksFailed extends React.Component<
  IPullRequestChecksFailedProps,
  IPullRequestChecksFailedState
> {
  private checkRunsLoadCancelled: boolean = false

  public constructor(props: IPullRequestChecksFailedProps) {
    super(props)

    const { checks } = this.props

    const selectedCheck = checks.find(isFailure) ?? checks[0]
    this.state = {
      switchingToPullRequest: false,
      selectedCheckID: selectedCheck.id,
      checks,
      loadingActionWorkflows: true,
      loadingActionLogs: true,
    }
  }

  private get selectedCheck(): IRefCheck | undefined {
    return this.state.checks.find(
      check => check.id === this.state.selectedCheckID
    )
  }

  private get loadingChecksInfo(): boolean {
    return this.state.loadingActionWorkflows || this.state.loadingActionLogs
  }

  public render() {
    let okButtonTitle = __DARWIN__ ? '切换到拉取请求' : '切换到拉取请求'

    if (this.props.shouldChangeRepository) {
      okButtonTitle = __DARWIN__
        ? '切换到存储库并拉取请求'
        : '切换到存储库并拉取请求'
    }

    const { pullRequest } = this.props

    const loadingChecksInfo = this.loadingChecksInfo

    const failedChecks = this.state.checks.filter(isFailure)
    const pluralChecks = failedChecks.length > 1 ? '检查' : '检查'

    const header = (
      <div className="ci-check-run-dialog-header">
        <Octicon symbol={OcticonSymbol.xCircleFill} />
        <div className="title-container">
          <div className="summary">
            {failedChecks.length} {pluralChecks} 拉取请求失败
          </div>
          <span className="pr-title">
            <span className="pr-title">{pullRequest.title}</span>{' '}
            <span className="pr-number">#{pullRequest.pullRequestNumber}</span>{' '}
          </span>
        </div>
        {this.renderRerunButton()}
      </div>
    )

    return (
      <Dialog
        id="pull-request-checks-failed"
        type="normal"
        title={header}
        dismissable={false}
        onSubmit={this.props.onSubmit}
        onDismissed={this.props.onDismissed}
        loading={loadingChecksInfo || this.state.switchingToPullRequest}
      >
        <DialogContent>
          <Row>
            <div className="ci-check-run-dialog-container">
              <div className="ci-check-run-content">
                {this.renderCheckRunJobs()}
                {this.renderCheckRunSteps()}
              </div>
            </div>
          </Row>
        </DialogContent>
        <DialogFooter>
          <Row>
            {this.renderSummary()}
            <OkCancelButtonGroup
              onCancelButtonClick={this.props.onDismissed}
              cancelButtonText="驳回"
              okButtonText={okButtonTitle}
              okButtonDisabled={this.state.switchingToPullRequest}
              onOkButtonClick={this.onSubmit}
            />
          </Row>
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSummary() {
    const failedChecks = this.state.checks.filter(isFailure)
    const pluralThem = failedChecks.length > 1 ? '它们' : '它们'
    return (
      <div className="footer-question">
        <span>是否要立即切换到该拉动请求并开始修复 {pluralThem}?</span>
      </div>
    )
  }

  private onRerunJob = (check: IRefCheck) => {
    this.rerunChecks(false, [check])
  }

  private renderCheckRunJobs() {
    return (
      <CICheckRunList
        checkRuns={this.state.checks}
        loadingActionLogs={this.state.loadingActionLogs}
        loadingActionWorkflows={this.state.loadingActionWorkflows}
        selectable={true}
        onViewCheckDetails={this.onViewOnGitHub}
        onCheckRunClick={this.onCheckRunClick}
        onRerunJob={
          supportsRerunningIndividualOrFailedChecks(
            this.props.repository.gitHubRepository.endpoint
          )
            ? this.onRerunJob
            : undefined
        }
      />
    )
  }

  private renderCheckRunSteps() {
    const selectedCheck = this.selectedCheck
    if (selectedCheck === undefined) {
      return null
    }

    let stepsContent = null

    if (this.loadingChecksInfo) {
      stepsContent = this.renderCheckRunStepsLoading()
    } else if (selectedCheck.actionJobSteps === undefined) {
      stepsContent = this.renderEmptyLogOutput()
    } else {
      stepsContent = (
        <CICheckRunActionsJobStepList
          steps={selectedCheck.actionJobSteps}
          onViewJobStep={this.onViewJobStep}
        />
      )
    }

    return (
      <div className="ci-check-run-job-steps-container">{stepsContent}</div>
    )
  }

  private renderCheckRunStepsLoading(): JSX.Element {
    return (
      <div className="loading-check-runs">
        <img src={BlankSlateImage} className="blankslate-image" />
        <div className="title">准备</div>
        <div className="call-to-action">检查运行步骤!</div>
      </div>
    )
  }
  private renderEmptyLogOutput() {
    return (
      <div className="no-steps-to-display">
        <div className="text">
          此检查没有可显示的步骤.
          <div>
            <LinkButton onClick={this.onViewSelectedCheckRunOnGitHub}>
              查看检查详细信息
            </LinkButton>
          </div>
        </div>
        <img src={PaperStackImage} className="blankslate-image" />
      </div>
    )
  }

  private onViewJobStep = (step: IAPIWorkflowJobStep): void => {
    const { repository, pullRequest, dispatcher } = this.props
    const checkRun = this.selectedCheck

    if (checkRun === undefined) {
      return
    }

    const url = getCheckRunStepURL(
      checkRun,
      step,
      repository.gitHubRepository,
      pullRequest.pullRequestNumber
    )

    if (url !== null) {
      dispatcher.openInBrowser(url)
    }
  }

  public componentDidMount() {
    this.loadCheckRunLogs()
  }

  public componentWillUnmount() {
    this.checkRunsLoadCancelled = true
  }

  private renderRerunButton = () => {
    const { checks } = this.state
    return (
      <div className="ci-check-rerun">
        <CICheckReRunButton
          disabled={checks.length === 0}
          checkRuns={checks}
          canReRunFailed={supportsRerunningIndividualOrFailedChecks(
            this.props.repository.gitHubRepository.endpoint
          )}
          onRerunChecks={this.rerunChecks}
        />
      </div>
    )
  }

  private rerunChecks = (
    failedOnly: boolean,
    checks?: ReadonlyArray<IRefCheck>
  ) => {
    this.props.dispatcher.recordChecksFailedDialogRerunChecks()

    const prRef = getPullRequestCommitRef(
      this.props.pullRequest.pullRequestNumber
    )

    this.props.dispatcher.showPopup({
      type: PopupType.CICheckRunRerun,
      checkRuns: checks ?? this.state.checks,
      repository: this.props.repository.gitHubRepository,
      prRef,
      failedOnly,
    })
  }

  private async loadCheckRunLogs() {
    const { pullRequest, repository } = this.props
    const { gitHubRepository } = repository

    const account = this.props.accounts.find(
      a => a.endpoint === gitHubRepository.endpoint
    )

    if (account === undefined) {
      this.setState({
        loadingActionWorkflows: false,
        loadingActionLogs: false,
      })
      return
    }

    const api = API.fromAccount(account)

    /*
      Until we retrieve the actions workflows, we don't know if a check run has
      action logs to output, thus, we want to show loading until then. However,
      once the workflows have been retrieved and since the logs retrieval and
      parsing can be noticeably time consuming. We go ahead and flip a flag so
      that we know we can go ahead and display the checkrun `output` content if
      a check run does not have action logs to retrieve/parse.
    */
    const checkRunsWithActionsUrls = await getCheckRunActionsWorkflowRuns(
      account,
      gitHubRepository.owner.login,
      gitHubRepository.name,
      pullRequest.head.ref,
      this.props.checks
    )

    if (this.checkRunsLoadCancelled) {
      return
    }

    this.setState({
      checks: checkRunsWithActionsUrls,
      loadingActionWorkflows: false,
    })

    const checks = await getLatestPRWorkflowRunsLogsForCheckRun(
      api,
      gitHubRepository.owner.login,
      gitHubRepository.name,
      checkRunsWithActionsUrls
    )

    if (this.checkRunsLoadCancelled) {
      return
    }

    this.setState({ checks, loadingActionLogs: false })
  }

  private onCheckRunClick = (checkRun: IRefCheck): void => {
    this.setState({ selectedCheckID: checkRun.id })
  }

  private onViewSelectedCheckRunOnGitHub = () => {
    const selectedCheck = this.selectedCheck
    if (selectedCheck !== undefined) {
      this.onViewOnGitHub(selectedCheck)
    }
  }

  private onViewOnGitHub = (checkRun: IRefCheck) => {
    const { repository, pullRequest, dispatcher } = this.props

    // Some checks do not provide htmlURLS like ones for the legacy status
    // object as they do not have a view in the checks screen. In that case we
    // will just open the PR and they can navigate from there... a little
    // dissatisfying tho more of an edgecase anyways.
    const url =
      checkRun.htmlUrl ??
      `${repository.gitHubRepository.htmlURL}/pull/${pullRequest.pullRequestNumber}`
    if (url === null) {
      // The repository should have a htmlURL.
      return
    }
    dispatcher.openInBrowser(url)
  }

  private onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const { dispatcher, repository, pullRequest } = this.props

    this.props.dispatcher.recordChecksFailedDialogSwitchToPullRequest()

    this.setState({ switchingToPullRequest: true })
    await dispatcher.selectRepository(repository)
    await dispatcher.checkoutPullRequest(repository, pullRequest)
    this.setState({ switchingToPullRequest: false })

    this.props.onDismissed()
  }
}
