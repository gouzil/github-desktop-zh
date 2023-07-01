import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Button } from '../lib/button'
import { KeyboardShortcut } from '../keyboard-shortcut/keyboard-shortcut'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-branches.svg'
)

interface INoBranchesProps {
  /** The callback to invoke when the user wishes to create a new branch */
  readonly onCreateNewBranch: () => void
  /** True to display the UI elements for creating a new branch, false to hide them */
  readonly canCreateNewBranch: boolean
  /** Optional: No branches message */
  readonly noBranchesMessage?: string | JSX.Element
}

export class NoBranches extends React.Component<INoBranchesProps> {
  public render() {
    if (this.props.canCreateNewBranch) {
      return (
        <div className="no-branches">
          <img src={BlankSlateImage} className="blankslate-image" alt="" />

          <div className="title">对不起, 找不到分支</div>

          <div className="subtitle">是否改为创建新分支?</div>

          <Button
            className="create-branch-button"
            onClick={this.props.onCreateNewBranch}
            type="submit"
          >
            {__DARWIN__ ? '创建新分支' : '创建新分支'}
          </Button>

          <div className="protip">
            专业提示! 按{' '}
            <KeyboardShortcut
              darwinKeys={['⌘', '⇧', 'N']}
              keys={['Ctrl', 'Shift', 'N']}
            />{' '}
            从应用程序中的任何位置快速创建新分支
          </div>
        </div>
      )
    }

    return (
      <div className="no-branches">
        {this.props.noBranchesMessage ?? '对不起, 找不到分支'}
      </div>
    )
  }
}
