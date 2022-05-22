import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IInstallGitProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * The path to the current repository, in case the user wants to continue
   * doing whatever they're doing.
   */
  readonly path: string

  /** Called when the user chooses to open the shell. */
  readonly onOpenShell: (path: string) => void
}

/**
 * A dialog indicating that Git wasn't found, to direct the user to an
 * external resource for more information about setting up their environment.
 */
export class InstallGit extends React.Component<IInstallGitProps, {}> {
  public constructor(props: IInstallGitProps) {
    super(props)
  }

  private onSubmit = () => {
    this.props.onOpenShell(this.props.path)
    this.props.onDismissed()
  }

  private onExternalLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const url = `https://help.github.com/articles/set-up-git/#setting-up-git`
    shell.openExternal(url)
  }

  public render() {
    return (
      <Dialog
        id="install-git"
        type="warning"
        title={__DARWIN__ ? '找不到Git' : '找不到git'}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            我们无法在您的系统上找到Git。这意味着您将无法在{' '}
            {__DARWIN__ ? '终端' : '命令提示符'}使用.
          </p>
          <p>为了帮助您为操作系统安装和配置Git, 我们提供了一些外部资源.</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '打开外置git' : '打开外置Git'}
            cancelButtonText="安装Git"
            onCancelButtonClick={this.onExternalLink}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
