import { IAPIRepository } from '../../lib/api'
import { IFilterListGroup, IFilterListItem } from '../lib/filter-list'
import { caseInsensitiveCompare } from '../../lib/compare'
import { OcticonSymbolType } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'

/** The identifier for the "Your Repositories" grouping. */
export const YourRepositoriesIdentifier = 'your-repositories'

export interface ICloneableRepositoryListItem extends IFilterListItem {
  /** The identifier for the item. */
  readonly id: string

  /** The search text. */
  readonly text: ReadonlyArray<string>

  /** The name of the repository. */
  readonly name: string

  /** The icon for the repo. */
  readonly icon: OcticonSymbolType

  /** The clone URL. */
  readonly url: string
}

function getIcon(gitHubRepo: IAPIRepository): OcticonSymbolType {
  if (gitHubRepo.private) {
    return OcticonSymbol.lock
  }
  if (gitHubRepo.fork) {
    return OcticonSymbol.repoForked
  }

  return OcticonSymbol.repo
}

function convert(
  repositories: ReadonlyArray<IAPIRepository>
): ReadonlyArray<ICloneableRepositoryListItem> {
  const repos: ReadonlyArray<ICloneableRepositoryListItem> = repositories.map(
    repo => {
      const icon = getIcon(repo)

      return {
        id: repo.html_url,
        text: [`${repo.owner.login}/${repo.name}`],
        url: repo.clone_url,
        name: repo.name,
        icon,
      }
    }
  )

  return repos
}

export function groupRepositories(
  repositories: ReadonlyArray<IAPIRepository>,
  login: string
): ReadonlyArray<IFilterListGroup<ICloneableRepositoryListItem>> {
  const userRepos = repositories.filter(repo => repo.owner.type === 'User')
  const orgRepos = repositories.filter(
    repo => repo.owner.type === 'Organization'
  )

  const groups = [
    {
      identifier: YourRepositoriesIdentifier,
      items: convert(userRepos),
    },
  ]

  const orgs = orgRepos.map(repo => repo.owner.login)
  const distinctOrgs = Array.from(new Set(orgs))

  for (const org of distinctOrgs.sort(caseInsensitiveCompare)) {
    const orgRepositories = orgRepos.filter(repo => repo.owner.login === org)

    groups.push({
      identifier: org,
      items: convert(orgRepositories),
    })
  }

  return groups
}
