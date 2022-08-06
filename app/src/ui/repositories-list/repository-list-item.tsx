import * as React from 'react'
import { clipboard } from 'electron'

import { Repository } from '../../models/repository'
import { Octicon, iconForRepository } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { showContextualMenu } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { IMenuItem } from '../../lib/menu-item'
import { HighlightText } from '../lib/highlight-text'
import { IMatches } from '../../lib/fuzzy-find'
import { IAheadBehind } from '../../models/branch'
import {
  RevealInFileManagerLabel,
  DefaultEditorLabel,
} from '../lib/context-menu'
import { enableRepositoryAliases } from '../../lib/feature-flag'
import classNames from 'classnames'
import { createObservableRef } from '../lib/observable-ref'
import { Tooltip } from '../lib/tooltip'
import { TooltippedContent } from '../lib/tooltipped-content'

interface IRepositoryListItemProps {
  readonly repository: Repositoryish

  /** Whether the user has enabled the setting to confirm removing a repository from the app */
  readonly askForConfirmationOnRemoveRepository: boolean

  /** Called when the repository should be removed. */
  readonly onRemoveRepository: (repository: Repositoryish) => void

  /** Called when the repository should be shown in Finder/Explorer/File Manager. */
  readonly onShowRepository: (repository: Repositoryish) => void

  /** Called when the repository should be opened on GitHub in the default web browser. */
  readonly onViewOnGitHub: (repository: Repositoryish) => void

  /** Called when the repository should be shown in the shell. */
  readonly onOpenInShell: (repository: Repositoryish) => void

  /** Called when the repository should be opened in an external editor */
  readonly onOpenInExternalEditor: (repository: Repositoryish) => void

  /** Called when the repository alias should be changed */
  readonly onChangeRepositoryAlias: (repository: Repository) => void

  /** Called when the repository alias should be removed */
  readonly onRemoveRepositoryAlias: (repository: Repository) => void

  /** The current external editor selected by the user */
  readonly externalEditorLabel?: string

  /** Does the repository need to be disambiguated in the list? */
  readonly needsDisambiguation: boolean

  /** The label for the user's preferred shell. */
  readonly shellLabel: string

  /** The characters in the repository name to highlight */
  readonly matches: IMatches

  /** Number of commits this local repo branch is behind or ahead of its remote branch */
  readonly aheadBehind: IAheadBehind | null

  /** Number of uncommitted changes */
  readonly changedFilesCount: number
}

/** A repository item. */
export class RepositoryListItem extends React.Component<
  IRepositoryListItemProps,
  {}
> {
  private readonly listItemRef = createObservableRef<HTMLDivElement>()

  public render() {
    const repository = this.props.repository
    const gitHubRepo =
      repository instanceof Repository ? repository.gitHubRepository : null
    const hasChanges = this.props.changedFilesCount > 0

    const alias: string | null =
      repository instanceof Repository ? repository.alias : null

    let prefix: string | null = null
    if (this.props.needsDisambiguation && gitHubRepo) {
      prefix = `${gitHubRepo.owner.login}/`
    }

    const classNameList = classNames('name', {
      alias: alias !== null,
    })

    return (
      <div
        onContextMenu={this.onContextMenu}
        className="repository-list-item"
        ref={this.listItemRef}
      >
        <Tooltip target={this.listItemRef}>{this.renderTooltip()}</Tooltip>

        <Octicon
          className="icon-for-repository"
          symbol={iconForRepository(repository)}
        />

        <div className={classNames(classNameList)}>
          {prefix ? <span className="prefix">{prefix}</span> : null}
          <HighlightText
            text={alias ?? repository.name}
            highlight={this.props.matches.title}
          />
        </div>

        {repository instanceof Repository &&
          renderRepoIndicators({
            aheadBehind: this.props.aheadBehind,
            hasChanges: hasChanges,
          })}
      </div>
    )
  }
  private renderTooltip() {
    const repo = this.props.repository
    const gitHubRepo = repo instanceof Repository ? repo.gitHubRepository : null
    const alias = repo instanceof Repository ? repo.alias : null
    const realName = gitHubRepo ? gitHubRepo.fullName : repo.name

    return (
      <>
        <div>
          <strong>{realName}</strong>
          {alias && <> ({alias})</>}
        </div>
        <div>{repo.path}</div>
      </>
    )
  }

  public shouldComponentUpdate(nextProps: IRepositoryListItemProps): boolean {
    if (
      nextProps.repository instanceof Repository &&
      this.props.repository instanceof Repository
    ) {
      return (
        nextProps.repository.id !== this.props.repository.id ||
        nextProps.matches !== this.props.matches
      )
    } else {
      return true
    }
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()

    const repository = this.props.repository
    const missing = repository instanceof Repository && repository.missing
    const github =
      repository instanceof Repository && repository.gitHubRepository != null
    const openInExternalEditor = this.props.externalEditorLabel
      ? `在 ${this.props.externalEditorLabel} 中打开`
      : DefaultEditorLabel

    const items: ReadonlyArray<IMenuItem> = [
      ...this.buildAliasMenuItems(),
      {
        label: __DARWIN__
          ? '复制存储库名称 (Copy Repo Name)'
          : '复制存储库名称 (Copy Repo Name)',
          action: this.copyNameToClipboard,
      },
      {
        label: __DARWIN__ ? '复制存储库路径 (Copy Repo Path)' : '复制存储库路径 (Copy Repo Path)',
        action: this.copyPathToClipboard,
      },
      { type: 'separator' },
      {
        label: '在 GitHub 中查看',
        action: this.viewOnGitHub,
        enabled: github,
      },
      {
        label: `在 ${this.props.shellLabel} 中打开`,
        action: this.openInShell,
        enabled: !missing,
      },
      {
        label: RevealInFileManagerLabel,
        action: this.showRepository,
        enabled: !missing,
      },
      {
        label: openInExternalEditor,
        action: this.openInExternalEditor,
        enabled: !missing,
      },
      { type: 'separator' },
      {
        label: this.props.askForConfirmationOnRemoveRepository
          ? '删除…'
          : '删除',
        action: this.removeRepository,
      },
    ]

    showContextualMenu(items)
  }

  private buildAliasMenuItems(): ReadonlyArray<IMenuItem> {
    const repository = this.props.repository

    if (!(repository instanceof Repository) || !enableRepositoryAliases()) {
      return []
    }

    const verb = repository.alias == null ? '创建' : '变更'
    const items: Array<IMenuItem> = [
      {
        label: __DARWIN__ ? `${verb} 别名` : `${verb} 别名`,
        action: this.changeAlias,
      },
    ]

    if (repository.alias !== null) {
      items.push({
        label: __DARWIN__ ? '删除别名' : '删除别名',
        action: this.removeAlias,
      })
    }

    return items
  }

  private removeRepository = () => {
    this.props.onRemoveRepository(this.props.repository)
  }

  private showRepository = () => {
    this.props.onShowRepository(this.props.repository)
  }

  private viewOnGitHub = () => {
    this.props.onViewOnGitHub(this.props.repository)
  }

  private openInShell = () => {
    this.props.onOpenInShell(this.props.repository)
  }

  private openInExternalEditor = () => {
    this.props.onOpenInExternalEditor(this.props.repository)
  }

  private changeAlias = () => {
    if (this.props.repository instanceof Repository) {
      this.props.onChangeRepositoryAlias(this.props.repository)
    }
  }

  private removeAlias = () => {
    if (this.props.repository instanceof Repository) {
      this.props.onRemoveRepositoryAlias(this.props.repository)
    }
  }

  private copyNameToClipboard = () => {
    clipboard.writeText(this.props.repository.name)
  }

  private copyPathToClipboard = () => {
    clipboard.writeText(this.props.repository.path)
  }
}

const renderRepoIndicators: React.FunctionComponent<{
  aheadBehind: IAheadBehind | null
  hasChanges: boolean
}> = props => {
  return (
    <div className="repo-indicators">
      {props.aheadBehind && renderAheadBehindIndicator(props.aheadBehind)}
      {props.hasChanges && renderChangesIndicator()}
    </div>
  )
}

const renderAheadBehindIndicator = (aheadBehind: IAheadBehind) => {
  const { ahead, behind } = aheadBehind
  if (ahead === 0 && behind === 0) {
    return null
  }

  const aheadBehindTooltip =
    '当前签出的分支是在' +
    (behind ? ` ${commitGrammar(behind)} 后面 ` : '') +
    (behind && ahead ? '和' : '') +
    (ahead ? ` ${commitGrammar(ahead)} 前面 ` : '') +
    '其跟踪分支.'

  return (
    <div className="ahead-behind" title={aheadBehindTooltip}>
      {ahead > 0 && <Octicon symbol={OcticonSymbol.arrowUp} />}
      {behind > 0 && <Octicon symbol={OcticonSymbol.arrowDown} />}
    </div>
  )
}

const renderChangesIndicator = () => {
  return (
    <TooltippedContent
      className="change-indicator-wrapper"
      tooltip="此存储库中有未提交的更改"
    >
      <Octicon symbol={OcticonSymbol.dotFill} />
    </TooltippedContent>
  )
}

const commitGrammar = (commitNum: number) =>
  `${commitNum} 提交${commitNum > 1 ? '' : ''}` // english very is hard
