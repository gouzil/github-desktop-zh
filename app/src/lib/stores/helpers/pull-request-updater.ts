import { Account } from '../../../models/account'
import { RepositoryWithGitHubRepository } from '../../../models/repository'
import { PullRequestCoordinator } from '../pull-request-coordinator'

/** Check for new or updated pull requests every 30 minutes */
const PullRequestInterval = 30 * 60 * 1000

/**
 * Never check for new or updated pull requests more
 * frequently than every 2 minutes
 */
const MaxPullRequestRefreshFrequency = 2 * 60 * 1000

/**
 * Periodically requests a refresh of the list of open pull requests
 * for a particular GitHub repository. The intention is for the
 * updater to only run when the app is in focus. When the updater
 * is started (in other words when the app is focused) it will
 * refresh the list of open pull requests as soon as possible while
 * ensuring that we never update more frequently than the value
 * indicated by the `MaxPullRequestRefreshFrequency` variable.
 */
export class PullRequestUpdater {
  private timeoutId: number | null = null
  private running = false

  public constructor(
    private readonly repository: RepositoryWithGitHubRepository,
    private readonly account: Account,
    private readonly coordinator: PullRequestCoordinator
  ) {}

  /** Starts the updater */
  public start() {
    if (!this.running) {
      this.running = true
      this.scheduleTick(MaxPullRequestRefreshFrequency)
    }
  }

  private getTimeSinceLastRefresh() {
    const lastRefreshed = this.coordinator.getLastRefreshed(this.repository)
    const timeSince =
      lastRefreshed === undefined ? Infinity : Date.now() - lastRefreshed
    return timeSince
  }

  private scheduleTick(timeout: number = PullRequestInterval) {
    if (this.running) {
      const due = Math.max(timeout - this.getTimeSinceLastRefresh(), 0)
      this.timeoutId = window.setTimeout(() => this.tick(), due)
    }
  }

  private tick() {
    if (!this.running) {
      return
    }

    this.timeoutId = null
    if (this.getTimeSinceLastRefresh() < MaxPullRequestRefreshFrequency) {
      this.scheduleTick()
    }

    this.coordinator
      .refreshPullRequests(this.repository, this.account)
      .catch(() => {})
      .then(() => this.scheduleTick())
  }

  public stop() {
    if (this.running) {
      if (this.timeoutId !== null) {
        window.clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
      this.running = false
    }
  }
}
