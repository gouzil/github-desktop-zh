import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { InstalledCLIPath } from '../lib/install-cli'

interface ICLIInstalledProps {
  /** Called when the popup should be dismissed. */
  readonly onDismissed: () => void
}

/** Tell the user the CLI tool was successfully installed. */
export class CLIInstalled extends React.Component<ICLIInstalledProps, {}> {
  public render() {
    return (
      <Dialog
        title={__DARWIN__ ? '命令行工具已安装' : '命令行工具已安装'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
      >
        <DialogContent>
          <div>
            命令行工具已安装在 <strong>{InstalledCLIPath}</strong>.
          </div>
        </DialogContent>
        <DefaultDialogFooter buttonText="Ok" />
      </Dialog>
    )
  }
}
