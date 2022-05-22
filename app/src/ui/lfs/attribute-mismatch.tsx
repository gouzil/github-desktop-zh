import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { getGlobalConfigPath } from '../../lib/git'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void
}

interface IAttributeMismatchState {
  readonly globalGitConfigPath: string | null
}

export class AttributeMismatch extends React.Component<
  IAttributeMismatchProps,
  IAttributeMismatchState
> {
  public constructor(props: IAttributeMismatchProps) {
    super(props)

    this.state = {
      globalGitConfigPath: null,
    }
  }

  public async componentDidMount() {
    try {
      const path = await getGlobalConfigPath()
      this.setState({ globalGitConfigPath: path })
    } catch (error) {
      log.warn(`Couldn't get the global git config path`, error)
    }
  }

  private renderGlobalGitConfigLink() {
    const path = this.state.globalGitConfigPath
    const msg = '您的全局git配置'
    if (path) {
      return <LinkButton onClick={this.showGlobalGitConfig}>{msg}</LinkButton>
    } else {
      return msg
    }
  }

  private showGlobalGitConfig = () => {
    const path = this.state.globalGitConfigPath
    if (path) {
      shell.openPath(path)
    }
  }

  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title={__DARWIN__ ? '更新现有Git LFS筛选器?' : '更新现有Git LFS筛选器?'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            Git LFS筛选器已在中配置 {this.renderGlobalGitConfigLink()}{' '}
            但这并不是它所期望的价值。您想现在更新它们吗?
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? '更新现有筛选器 (existing filters)'
                : '更新现有筛选器 (existing filters)'
            }
            cancelButtonText={__DARWIN__ ? '不是现在' : '不是现在'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    this.props.onUpdateExistingFilters()
    this.props.onDismissed()
  }
}
