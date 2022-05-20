import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DefaultDialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { shell } from '../../lib/app-shell'
import { suggestedExternalEditor } from '../../lib/editors/shared'

interface IEditorErrorProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * Event to trigger if the user navigates to the Preferences dialog
   */
  readonly showPreferencesDialog: () => void

  /**
   * The text to display to the user relating to this error.
   */
  readonly message: string

  /** Render the "Install ${Default}" link as the default action */
  readonly suggestDefaultEditor?: boolean

  /** Render the "Open Preferences" link as the default action */
  readonly viewPreferences?: boolean
}

/**
 * A dialog indicating something went wrong with launching an external editor,
 * with guidance to get the user back to a happy places
 */
export class EditorError extends React.Component<IEditorErrorProps, {}> {
  public constructor(props: IEditorErrorProps) {
    super(props)
  }

  private onExternalLink = () => {
    shell.openExternal(suggestedExternalEditor.url)
  }

  private onShowPreferencesDialog = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    this.props.onDismissed()
    this.props.showPreferencesDialog()
  }

  private renderFooter() {
    const { viewPreferences, suggestDefaultEditor } = this.props

    if (viewPreferences) {
      return (
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="关闭"
            cancelButtonText={__DARWIN__ ? '打开首选项' : '打开首选项'}
            onCancelButtonClick={this.onShowPreferencesDialog}
          />
        </DialogFooter>
      )
    } else if (suggestDefaultEditor) {
      return (
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="关闭"
            cancelButtonText={`下载 ${suggestedExternalEditor.name}`}
            onCancelButtonClick={this.onExternalLink}
          />
        </DialogFooter>
      )
    }

    return <DefaultDialogFooter />
  }

  public render() {
    const title = __DARWIN__
      ? '无法打开外部编辑器'
      : '无法打开外部编辑器'

    return (
      <Dialog
        id="external-editor-error"
        type="error"
        title={title}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>{this.props.message}</p>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }
}
