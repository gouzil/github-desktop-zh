import * as React from 'react'

import { IAutocompletionProvider } from './index'
import { GitHubUserStore } from '../../lib/stores'
import { GitHubRepository } from '../../models/github-repository'
import { Account } from '../../models/account'
import { IMentionableUser } from '../../lib/databases/index'

/** An autocompletion hit for a user. */
export interface IUserHit {
  /** The username. */
  readonly username: string

  /**
   * The user's name or null if the user
   * hasn't entered a name in their profile
   */
  readonly name: string | null

  /**
   * The user's public email address. If the user
   * hasn't selected a public email address this
   * field will be an empty string.
   */
  readonly email: string

  readonly endpoint: string
}

function userToHit(
  repository: GitHubRepository,
  user: IMentionableUser
): IUserHit {
  return {
    username: user.login,
    name: user.name,
    email: user.email,
    endpoint: repository.endpoint,
  }
}

/** The autocompletion provider for user mentions in a GitHub repository. */
export class UserAutocompletionProvider
  implements IAutocompletionProvider<IUserHit>
{
  public readonly kind = 'user'

  private readonly gitHubUserStore: GitHubUserStore
  private readonly repository: GitHubRepository
  private readonly account: Account | null

  public constructor(
    gitHubUserStore: GitHubUserStore,
    repository: GitHubRepository,
    account?: Account
  ) {
    this.gitHubUserStore = gitHubUserStore
    this.repository = repository
    this.account = account || null
  }

  public getRegExp(): RegExp {
    return /(?:^|\n| )(?:@)([a-z\d\\+-][a-z\d_-]*)?/g
  }

  public async getAutocompletionItems(
    text: string
  ): Promise<ReadonlyArray<IUserHit>> {
    const users = await this.gitHubUserStore.getMentionableUsersMatching(
      this.repository,
      text
    )

    // dotcom doesn't let you autocomplete on your own handle
    const account = this.account
    const filtered = account
      ? users.filter(x => x.login !== account.login)
      : users

    return filtered.map(x => userToHit(this.repository, x))
  }

  public renderItem(item: IUserHit): JSX.Element {
    return (
      <div className="user" key={item.username}>
        <span className="username">{item.username}</span>
        <span className="name">{item.name}</span>
      </div>
    )
  }

  public getCompletionText(item: IUserHit): string {
    return `@${item.username}`
  }

  /**
   * Retrieve a user based on the user login name, i.e their handle.
   *
   * If the user is already cached no additional API requests
   * will be made. If the user isn't in the cache but found in
   * the API it will be persisted to the database and the
   * intermediate cache.
   *
   * @param login   The login (i.e. handle) of the user
   */
  public async exactMatch(login: string): Promise<IUserHit | null> {
    if (this.account === null) {
      return null
    }

    const user = await this.gitHubUserStore.getByLogin(this.account, login)

    if (!user) {
      return null
    }

    return userToHit(this.repository, user)
  }
}
