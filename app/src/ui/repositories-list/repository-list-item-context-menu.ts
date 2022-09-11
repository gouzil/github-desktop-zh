import { Repository } from '../../models/repository'
import { IMenuItem } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { clipboard } from 'electron'
import {
  RevealInFileManagerLabel,
  DefaultEditorLabel,
} from '../lib/context-menu'

interface IRepositoryListItemContextMenuConfig {
  repository: Repositoryish
  shellLabel: string
  externalEditorLabel: string | undefined
  askForConfirmationOnRemoveRepository: boolean
  onViewOnGitHub: (repository: Repositoryish) => void
  onOpenInShell: (repository: Repositoryish) => void
  onShowRepository: (repository: Repositoryish) => void
  onOpenInExternalEditor: (repository: Repositoryish) => void
  onRemoveRepository: (repository: Repositoryish) => void
  onChangeRepositoryAlias: (repository: Repository) => void
  onRemoveRepositoryAlias: (repository: Repository) => void
}

export const generateRepositoryListContextMenu = (
  config: IRepositoryListItemContextMenuConfig
) => {
  const { repository } = config
  const missing = repository instanceof Repository && repository.missing
  const github =
    repository instanceof Repository && repository.gitHubRepository != null
  const openInExternalEditor = config.externalEditorLabel
    ? `在 ${config.externalEditorLabel} 中打开`
    : DefaultEditorLabel

  const items: ReadonlyArray<IMenuItem> = [
    ...buildAliasMenuItems(config),
    {
      label: __DARWIN__ ? '复制存储库名称 (Copy Repo Name)' : '复制存储库名称 (Copy Repo Name)',
      action: () => clipboard.writeText(repository.name),
    },
    {
      label: __DARWIN__ ? '复制存储库路径 (Copy Repo Path)' : '复制存储库路径 (Copy Repo Path)',
      action: () => clipboard.writeText(repository.path),
    },
    { type: 'separator' },
    {
      label: '在 GitHub 中查看',
      action: () => config.onViewOnGitHub(repository),
      enabled: github,
    },
    {
      label: `在 ${config.shellLabel} 中打开`,
      action: () => config.onOpenInShell(repository),
      enabled: !missing,
    },
    {
      label: RevealInFileManagerLabel,
      action: () => config.onShowRepository(repository),
      enabled: !missing,
    },
    {
      label: openInExternalEditor,
      action: () => config.onOpenInExternalEditor(repository),
      enabled: !missing,
    },
    { type: 'separator' },
    {
      label: config.askForConfirmationOnRemoveRepository ? '删除…' : '删除',
      action: () => config.onRemoveRepository(repository),
    },
  ]

  return items
}

const buildAliasMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (!(repository instanceof Repository)) {
    return []
  }

  const verb = repository.alias == null ? '创建' : '变更'
  const items: Array<IMenuItem> = [
    {
      label: __DARWIN__ ? `${verb} 别名` : `${verb} 别名`,
      action: () => config.onChangeRepositoryAlias(repository),
    },
  ]

  if (repository.alias !== null) {
    items.push({
      label: __DARWIN__ ? '删除别名' : '删除别名',
      action: () => config.onRemoveRepositoryAlias(repository),
    })
  }

  return items
}
