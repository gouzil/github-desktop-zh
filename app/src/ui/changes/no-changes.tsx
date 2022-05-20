import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'
import { Repository } from '../../models/repository'
import { LinkButton } from '../lib/link-button'
import { MenuIDs } from '../../models/menu-ids'
import { IMenu, MenuItem } from '../../models/app-menu'
import memoizeOne from 'memoize-one'
import { getPlatformSpecificNameOrSymbolForModifier } from '../../lib/menu-item'
import { MenuBackedSuggestedAction } from '../suggested-actions'
import { IRepositoryState } from '../../lib/app-state'
import { TipState, IValidBranch } from '../../models/tip'
import { Ref } from '../lib/ref'
import { IAheadBehind } from '../../models/branch'
import { IRemote } from '../../models/remote'
import { isCurrentBranchForcePush } from '../../lib/rebase'
import { StashedChangesLoadStates } from '../../models/stash-entry'
import { Dispatcher } from '../dispatcher'
import { SuggestedActionGroup } from '../suggested-actions'
import { PreferencesTab } from '../../models/preferences'
import { PopupType } from '../../models/popup'

function formatMenuItemLabel(text: string) {
  if (__WIN32__ || __LINUX__) {
    // Ampersand has a special meaning on Windows where it denotes
    // the access key (usually rendered as an underline on the following)
    // character. A literal ampersand is escaped by putting another ampersand
    // in front of it (&&). Here we strip single ampersands and unescape
    // double ampersands. Example: "&Push && Pull" becomes "Push & Pull".
    return text.replace(/&?&/g, m => (m.length > 1 ? '&' : ''))
  }

  return text
}

function formatParentMenuLabel(menuItem: IMenuItemInfo) {
  const parentMenusText = menuItem.parentMenuLabels.join(' -> ')
  return formatMenuItemLabel(parentMenusText)
}

const PaperStackImage = encodePathAsUrl(__dirname, 'static/paper-stack.svg')

interface INoChangesProps {
  readonly dispatcher: Dispatcher

  /**
   * The currently selected repository
   */
  readonly repository: Repository

  /**
   * The top-level application menu item.
   */
  readonly appMenu: IMenu | undefined

  /**
   * An object describing the current state of
   * the selected repository. Used to determine
   * whether to render push, pull, publish, or
   * 'open pr' actions.
   */
  readonly repositoryState: IRepositoryState

  /**
   * Whether or not the user has a configured (explicitly,
   * or automatically) external editor. Used to
   * determine whether or not to render the action for
   * opening the repository in an external editor.
   */
  readonly isExternalEditorAvailable: boolean
}

/**
 * Helper projection interface used to hold
 * computed information about a particular menu item.
 * Used internally in the NoChanges component to
 * trace whether a menu item is enabled, what its
 * keyboard shortcut is and so forth.
 */
interface IMenuItemInfo {
  /**
   * The textual representation of the menu item,
   * this is what's shown in the application menu
   */
  readonly label: string

  /**
   * Any accelerator keys (i.e. keyboard shortcut)
   * for the menu item. A menu item which can be
   * triggered using Command+Shift+K would be
   * represented here as three elements in the
   * array. Used to format and display the keyboard
   * shortcut for activating an action.
   */
  readonly acceleratorKeys: ReadonlyArray<string>

  /**
   * An ordered list of the labels for parent menus
   * of a particular menu item. Used to provide
   * a textual representation of where to locate
   * a particular action in the menu system.
   */
  readonly parentMenuLabels: ReadonlyArray<string>

  /**
   * Whether or not the menu item is currently
   * enabled.
   */
  readonly enabled: boolean
}

interface INoChangesState {
  /**
   * Whether or not to enable the slide in and
   * slide out transitions for the remote actions.
   *
   * Disabled initially and enabled 500ms after
   * component mounting in order to provide instant
   * loading of the remote action when the view is
   * initially appearing.
   */
  readonly enableTransitions: boolean
}

function getItemAcceleratorKeys(item: MenuItem) {
  if (item.type === 'separator' || item.type === 'submenuItem') {
    return []
  }

  if (item.accelerator === null) {
    return []
  }

  return item.accelerator
    .split('+')
    .map(getPlatformSpecificNameOrSymbolForModifier)
}

function buildMenuItemInfoMap(
  menu: IMenu,
  map = new Map<string, IMenuItemInfo>(),
  parent?: IMenuItemInfo
): ReadonlyMap<string, IMenuItemInfo> {
  for (const item of menu.items) {
    if (item.type === 'separator') {
      continue
    }

    const infoItem: IMenuItemInfo = {
      label: item.label,
      acceleratorKeys: getItemAcceleratorKeys(item),
      parentMenuLabels:
        parent === undefined ? [] : [parent.label, ...parent.parentMenuLabels],
      enabled: item.enabled,
    }

    map.set(item.id, infoItem)

    if (item.type === 'submenuItem') {
      buildMenuItemInfoMap(item.menu, map, infoItem)
    }
  }

  return map
}

/** The component to display when there are no local changes. */
export class NoChanges extends React.Component<
  INoChangesProps,
  INoChangesState
> {
  private getMenuInfoMap = memoizeOne((menu: IMenu | undefined) =>
    menu === undefined
      ? new Map<string, IMenuItemInfo>()
      : buildMenuItemInfoMap(menu)
  )

  /**
   * ID for the timer that's activated when the component
   * mounts. See componentDidMount/componentWillUnmount.
   */
  private transitionTimer: number | null = null

  public constructor(props: INoChangesProps) {
    super(props)
    this.state = {
      enableTransitions: false,
    }
  }

  private getMenuItemInfo(menuItemId: MenuIDs): IMenuItemInfo | undefined {
    return this.getMenuInfoMap(this.props.appMenu).get(menuItemId)
  }

  private getPlatformFileManagerName() {
    if (__DARWIN__) {
      return '访达 (Finder)'
    } else if (__WIN32__) {
      return '资源管理器 (Explorer)'
    }
    return '您的文件管理器'
  }

  private renderDiscoverabilityElements(menuItem: IMenuItemInfo) {
    const parentMenusText = formatParentMenuLabel(menuItem)

    return (
      <>
        存储库({parentMenusText})菜单或{' '}
        {this.renderDiscoverabilityKeyboardShortcut(menuItem)}
      </>
    )
  }

  private renderDiscoverabilityKeyboardShortcut(menuItem: IMenuItemInfo) {
    return menuItem.acceleratorKeys.map((k, i) => <kbd key={k + i}>{k}</kbd>)
  }

  private renderMenuBackedAction(
    itemId: MenuIDs,
    title: string,
    description?: string | JSX.Element,
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  ) {
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    return (
      <MenuBackedSuggestedAction
        title={title}
        description={description}
        discoverabilityContent={this.renderDiscoverabilityElements(menuItem)}
        menuItemId={itemId}
        buttonText={formatMenuItemLabel(menuItem.label)}
        disabled={!menuItem.enabled}
        onClick={onClick}
      />
    )
  }

  private renderShowInFileManager() {
    const fileManager = this.getPlatformFileManagerName()

    return this.renderMenuBackedAction(
      'open-working-directory',
      `在 ${fileManager} 中查看存储库的文件`,
      undefined,
      this.onShowInFileManagerClicked
    )
  }

  private onShowInFileManagerClicked = () =>
    this.props.dispatcher.recordSuggestedStepOpenWorkingDirectory()

  private renderViewOnGitHub() {
    const isGitHub = this.props.repository.gitHubRepository !== null

    if (!isGitHub) {
      return null
    }

    return this.renderMenuBackedAction(
      'view-repository-on-github',
      `在浏览器中的GitHub上打开存储库页面`,
      undefined,
      this.onViewOnGitHubClicked
    )
  }

  private onViewOnGitHubClicked = () =>
    this.props.dispatcher.recordSuggestedStepViewOnGitHub()

  private openIntegrationPreferences = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.Preferences,
      initialSelectedTab: PreferencesTab.Integrations,
    })
  }

  private renderOpenInExternalEditor() {
    if (!this.props.isExternalEditorAvailable) {
      return null
    }

    const itemId: MenuIDs = 'open-external-editor'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const preferencesMenuItem = this.getMenuItemInfo('preferences')

    if (preferencesMenuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const title = `在外部编辑器中打开存储库`

    const description = (
      <>
        在{' '}
        <LinkButton onClick={this.openIntegrationPreferences}>
          {__DARWIN__ ? '首选项 (Preferences)' : '选项 (Options)'}
        </LinkButton>
        中选择编辑器
      </>
    )

    return this.renderMenuBackedAction(
      itemId,
      title,
      description,
      this.onOpenInExternalEditorClicked
    )
  }

  private onOpenInExternalEditorClicked = () =>
    this.props.dispatcher.recordSuggestedStepOpenInExternalEditor()

  private renderRemoteAction() {
    const { remote, aheadBehind, branchesState, tagsToPush } =
      this.props.repositoryState
    const { tip, defaultBranch, currentPullRequest } = branchesState

    if (tip.kind !== TipState.Valid) {
      return null
    }

    if (remote === null) {
      return this.renderPublishRepositoryAction()
    }

    // Branch not published
    if (aheadBehind === null) {
      return this.renderPublishBranchAction(tip)
    }

    const isForcePush = isCurrentBranchForcePush(branchesState, aheadBehind)
    if (isForcePush) {
      // do not render an action currently after the rebase has completed, as
      // the default behaviour is currently to pull in changes from the tracking
      // branch which will could potentially lead to a more confusing history
      return null
    }

    if (aheadBehind.behind > 0) {
      return this.renderPullBranchAction(tip, remote, aheadBehind)
    }

    if (
      aheadBehind.ahead > 0 ||
      (tagsToPush !== null && tagsToPush.length > 0)
    ) {
      return this.renderPushBranchAction(tip, remote, aheadBehind, tagsToPush)
    }

    const isGitHub = this.props.repository.gitHubRepository !== null
    const hasOpenPullRequest = currentPullRequest !== null
    const isDefaultBranch =
      defaultBranch !== null && tip.branch.name === defaultBranch.name

    if (isGitHub && !hasOpenPullRequest && !isDefaultBranch) {
      return this.renderCreatePullRequestAction(tip)
    }

    return null
  }

  private renderViewStashAction() {
    const { changesState, branchesState } = this.props.repositoryState

    const { tip } = branchesState
    if (tip.kind !== TipState.Valid) {
      return null
    }

    const { stashEntry } = changesState
    if (stashEntry === null) {
      return null
    }

    if (stashEntry.files.kind !== StashedChangesLoadStates.Loaded) {
      return null
    }

    const numChanges = stashEntry.files.files.length
    const description = (
      <>
        您有 {numChanges} {numChanges === 1 ? '变化' : '变化'} 还没有提交的文件.
      </>
    )
    const discoverabilityContent = (
      <>
        当一个收藏存在时, 在Changes选项卡的左边访问它.
      </>
    )
    const itemId: MenuIDs = 'toggle-stashed-changes'
    const menuItem = this.getMenuItemInfo(itemId)
    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    return (
      <MenuBackedSuggestedAction
        key="view-stash-action"
        title="查看隐藏的更改"
        menuItemId={itemId}
        description={description}
        discoverabilityContent={discoverabilityContent}
        buttonText="视图隐藏"
        type="primary"
        disabled={menuItem !== null && !menuItem.enabled}
        onClick={this.onViewStashClicked}
      />
    )
  }

  private onViewStashClicked = () =>
    this.props.dispatcher.recordSuggestedStepViewStash()

  private renderPublishRepositoryAction() {
    // This is a bit confusing, there's no dedicated
    // publish menu item, the 'Push' menu item will initiate
    // a publish if the repository doesn't have a remote. We'll
    // use it here for the keyboard shortcut only.
    const itemId: MenuIDs = 'push'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const discoverabilityContent = (
      <>
        在工具栏中始终可用于本地存储库或{' '}
        {this.renderDiscoverabilityKeyboardShortcut(menuItem)}
      </>
    )

    return (
      <MenuBackedSuggestedAction
        key="publish-repository-action"
        title="将您的仓库发布到GitHub"
        description="此存储库目前仅在您的本地计算机上可用. 通过在GitHub上发布它, 您可以分享它, 并与他人合作."
        discoverabilityContent={discoverabilityContent}
        buttonText="发布存储库"
        menuItemId={itemId}
        type="primary"
        disabled={!menuItem.enabled}
        onClick={this.onPublishRepositoryClicked}
      />
    )
  }

  private onPublishRepositoryClicked = () =>
    this.props.dispatcher.recordSuggestedStepPublishRepository()

  private renderPublishBranchAction(tip: IValidBranch) {
    // This is a bit confusing, there's no dedicated
    // publish branch menu item, the 'Push' menu item will initiate
    // a publish if the branch doesn't have a remote tracking branch.
    // We'll use it here for the keyboard shortcut only.
    const itemId: MenuIDs = 'push'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const isGitHub = this.props.repository.gitHubRepository !== null

    const description = (
      <>
        当前分支 (<Ref>{tip.branch.name}</Ref>) 尚未发布
        到远程仓库. 通过发布它 {isGitHub ? '到GitHub' : ''} 您可以分享, 
        {isGitHub ? '打开一个拉取请求, ' : ''}
        与他人合作.
      </>
    )

    const discoverabilityContent = (
      <>
        总是在工具栏或{' '}
        {this.renderDiscoverabilityKeyboardShortcut(menuItem)}
      </>
    )

    return (
      <MenuBackedSuggestedAction
        key="publish-branch-action"
        title="发布您的分支"
        menuItemId={itemId}
        description={description}
        discoverabilityContent={discoverabilityContent}
        buttonText="发布分支"
        type="primary"
        disabled={!menuItem.enabled}
        onClick={this.onPublishBranchClicked}
      />
    )
  }

  private onPublishBranchClicked = () =>
    this.props.dispatcher.recordSuggestedStepPublishBranch()

  private renderPullBranchAction(
    tip: IValidBranch,
    remote: IRemote,
    aheadBehind: IAheadBehind
  ) {
    const itemId: MenuIDs = 'pull'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const isGitHub = this.props.repository.gitHubRepository !== null

    const description = (
      <>
        当前分支 (<Ref>{tip.branch.name}</Ref>) 有{' '}
        {aheadBehind.behind === 1 ? '提交' : '提交'} 在{' '}
        {isGitHub ? 'GitHub' : '远程'} 他们{' '}
        {aheadBehind.behind === 1 ? '没有' : '不'} 存在于您的计算机上.
      </>
    )

    const discoverabilityContent = (
      <>
        当有远程更改或{' '}
        {this.renderDiscoverabilityKeyboardShortcut(menuItem)}
      </>
    )

    const title = `拉取 ${aheadBehind.behind} ${
      aheadBehind.behind === 1 ? '提交' : '提交'
    } 来自 ${remote.name} 远程`

    const buttonText = `拉取 ${remote.name}`

    return (
      <MenuBackedSuggestedAction
        key="pull-branch-action"
        title={title}
        menuItemId={itemId}
        description={description}
        discoverabilityContent={discoverabilityContent}
        buttonText={buttonText}
        type="primary"
        disabled={!menuItem.enabled}
      />
    )
  }

  private renderPushBranchAction(
    tip: IValidBranch,
    remote: IRemote,
    aheadBehind: IAheadBehind,
    tagsToPush: ReadonlyArray<string> | null
  ) {
    const itemId: MenuIDs = 'push'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const isGitHub = this.props.repository.gitHubRepository !== null

    const itemsToPushTypes = []
    const itemsToPushDescriptions = []

    if (aheadBehind.ahead > 0) {
      itemsToPushTypes.push('commits')
      itemsToPushDescriptions.push(
        aheadBehind.ahead === 1
          ? '1个本地提交'
          : `${aheadBehind.ahead} 个本地提交`
      )
    }

    if (tagsToPush !== null && tagsToPush.length > 0) {
      itemsToPushTypes.push('tags')
      itemsToPushDescriptions.push(
        tagsToPush.length === 1 ? '1 个标签' : `${tagsToPush.length} 个标签`
      )
    }

    const description = `您有 ${itemsToPushDescriptions.join(
      ' and '
    )} 正在等待推送到 ${isGitHub ? 'GitHub' : '远程'}.`

    const discoverabilityContent = (
      <>
        当有本地提交等待推送时，总是在工具栏中可用 {this.renderDiscoverabilityKeyboardShortcut(menuItem)}
      </>
    )

    const title = `推送 ${itemsToPushTypes.join(' and ')} 到 ${
      remote.name
    } 远程`

    const buttonText = `推送 ${remote.name}`

    return (
      <MenuBackedSuggestedAction
        key="push-branch-action"
        title={title}
        menuItemId={itemId}
        description={description}
        discoverabilityContent={discoverabilityContent}
        buttonText={buttonText}
        type="primary"
        disabled={!menuItem.enabled}
      />
    )
  }

  private renderCreatePullRequestAction(tip: IValidBranch) {
    const itemId: MenuIDs = 'create-pull-request'
    const menuItem = this.getMenuItemInfo(itemId)

    if (menuItem === undefined) {
      log.error(`Could not find matching menu item for ${itemId}`)
      return null
    }

    const description = (
      <>
        当前分支 (<Ref>{tip.branch.name}</Ref>) 已经发布到GitHub。创建一个拉取请求来提议和协作您的变更.
      </>
    )

    const title = `从当前分支创建一个拉取请求`
    const buttonText = `创建一个拉取请求`

    return (
      <MenuBackedSuggestedAction
        key="create-pr-action"
        title={title}
        menuItemId={itemId}
        description={description}
        buttonText={buttonText}
        discoverabilityContent={this.renderDiscoverabilityElements(menuItem)}
        type="primary"
        disabled={!menuItem.enabled}
        onClick={this.onCreatePullRequestClicked}
      />
    )
  }

  private onCreatePullRequestClicked = () =>
    this.props.dispatcher.recordSuggestedStepCreatePullRequest()

  private renderActions() {
    return (
      <>
        <SuggestedActionGroup
          type="primary"
          transitions={'replace'}
          enableTransitions={this.state.enableTransitions}
        >
          {this.renderViewStashAction() || this.renderRemoteAction()}
        </SuggestedActionGroup>
        <SuggestedActionGroup>
          {this.renderOpenInExternalEditor()}
          {this.renderShowInFileManager()}
          {this.renderViewOnGitHub()}
        </SuggestedActionGroup>
      </>
    )
  }

  public componentDidMount() {
    this.transitionTimer = window.setTimeout(() => {
      this.setState({ enableTransitions: true })
      this.transitionTimer = null
    }, 500)
  }

  public componentWillUnmount() {
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer)
    }
  }

  public render() {
    return (
      <div id="no-changes">
        <div className="content">
          <div className="header">
            <div className="text">
              <h1>没有本地更改</h1>
              <p>
              此存储库中没有未提交的更改。
              这里有一些关于下一步该做什么的友好建议.
              </p>
            </div>
            <img src={PaperStackImage} className="blankslate-image" />
          </div>
          {this.renderActions()}
        </div>
      </div>
    )
  }
}
