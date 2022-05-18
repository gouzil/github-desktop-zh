import * as React from 'react'
import { Octicon, OcticonSymbolType } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import classNames from 'classnames'
import { GitHubRepository } from '../../models/github-repository'
import { IDisposable } from 'event-kit'
import { Dispatcher } from '../dispatcher'
import {
  ICombinedRefCheck,
  IRefCheck,
  isSuccess,
} from '../../lib/ci-checks/ci-checks'
import { IAPIWorkflowJobStep } from '../../lib/api'

interface ICIStatusProps {
  /** The classname for the underlying element. */
  readonly className?: string

  readonly dispatcher: Dispatcher

  /** The GitHub repository to use when looking up commit status. */
  readonly repository: GitHubRepository

  /** The commit ref (can be a SHA or a Git ref) for which to fetch status. */
  readonly commitRef: string

  /** A callback to bubble up whether there is a check displayed */
  readonly onCheckChange?: (check: ICombinedRefCheck | null) => void
}

interface ICIStatusState {
  readonly check: ICombinedRefCheck | null
}

/** The little CI status indicator. */
export class CIStatus extends React.PureComponent<
  ICIStatusProps,
  ICIStatusState
> {
  private statusSubscription: IDisposable | null = null

  public constructor(props: ICIStatusProps) {
    super(props)
    const check = props.dispatcher.tryGetCommitStatus(
      this.props.repository,
      this.props.commitRef
    )
    this.state = {
      check,
    }
    this.props.onCheckChange?.(check)
  }

  private subscribe() {
    this.unsubscribe()

    this.statusSubscription = this.props.dispatcher.subscribeToCommitStatus(
      this.props.repository,
      this.props.commitRef,
      this.onStatus
    )
  }

  private unsubscribe() {
    if (this.statusSubscription) {
      this.statusSubscription.dispose()
      this.statusSubscription = null
    }
  }

  public componentDidUpdate(prevProps: ICIStatusProps) {
    // Re-subscribe if we're being reused to show a different status.
    if (
      this.props.repository !== prevProps.repository ||
      this.props.commitRef !== prevProps.commitRef
    ) {
      this.setState({
        check: this.props.dispatcher.tryGetCommitStatus(
          this.props.repository,
          this.props.commitRef
        ),
      })
      this.subscribe()
    }
  }

  public componentDidMount() {
    this.subscribe()
  }

  public componentWillUnmount() {
    this.unsubscribe()
  }

  private onStatus = (check: ICombinedRefCheck | null) => {
    if (this.props.onCheckChange !== undefined) {
      this.props.onCheckChange(check)
    }

    this.setState({ check })
  }

  public render() {
    const { check } = this.state

    if (check === null || check.checks.length === 0) {
      return null
    }

    return (
      <Octicon
        className={classNames(
          'ci-status',
          `ci-status-${getClassNameForCheck(check)}`,
          this.props.className
        )}
        symbol={getSymbolForCheck(check)}
        title={getRefCheckSummary(check)}
      />
    )
  }
}

export function getSymbolForCheck(
  check: ICombinedRefCheck | IRefCheck | IAPIWorkflowJobStep
): OcticonSymbolType {
  switch (check.conclusion) {
    case 'timed_out':
      return OcticonSymbol.x
    case 'failure':
      return OcticonSymbol.x
    case 'neutral':
      return OcticonSymbol.squareFill
    case 'success':
      return OcticonSymbol.check
    case 'cancelled':
      return OcticonSymbol.stop
    case 'action_required':
      return OcticonSymbol.alert
    case 'skipped':
      return OcticonSymbol.skip
    case 'stale':
      return OcticonSymbol.issueReopened
  }

  // Pending
  return OcticonSymbol.dotFill
}

export function getClassNameForCheck(
  check: ICombinedRefCheck | IRefCheck | IAPIWorkflowJobStep
): string {
  switch (check.conclusion) {
    case 'timed_out':
      return 'timed-out'
    case 'action_required':
      return 'action-required'
    case 'failure':
    case 'neutral':
    case 'success':
    case 'cancelled':
    case 'skipped':
    case 'stale':
      return check.conclusion
  }

  // Pending
  return 'pending'
}

export function getSymbolForLogStep(
  logStep: IAPIWorkflowJobStep
): OcticonSymbolType {
  switch (logStep.conclusion) {
    case 'success':
      return OcticonSymbol.checkCircleFill
    case 'failure':
      return OcticonSymbol.xCircleFill
  }

  return getSymbolForCheck(logStep)
}

export function getClassNameForLogStep(logStep: IAPIWorkflowJobStep): string {
  switch (logStep.conclusion) {
    case 'failure':
      return logStep.conclusion
  }

  // Pending
  return ''
}

/**
 * Convert the combined check to an app-friendly string.
 */
export function getRefCheckSummary(check: ICombinedRefCheck): string {
  if (check.checks.length === 1) {
    const { name, description } = check.checks[0]
    return `${name}: ${description}`
  }

  const successCount = check.checks.reduce(
    (acc, cur) => acc + (isSuccess(cur) ? 1 : 0),
    0
  )

  return `${successCount}/${check.checks.length} checks OK`
}
