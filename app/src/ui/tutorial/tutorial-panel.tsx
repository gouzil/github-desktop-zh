import * as React from 'react'
import { join } from 'path'
import { LinkButton } from '../lib/link-button'
import { Button } from '../lib/button'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import {
  ValidTutorialStep,
  TutorialStep,
  orderedTutorialSteps,
} from '../../models/tutorial-step'
import { encodePathAsUrl } from '../../lib/path'
import { PopupType } from '../../models/popup'
import { PreferencesTab } from '../../models/preferences'
import { Ref } from '../lib/ref'
import { suggestedExternalEditor } from '../../lib/editors/shared'
import { TutorialStepInstructions } from './tutorial-step-instruction'
import { KeyboardShortcut } from '../keyboard-shortcut/keyboard-shortcut'

const TutorialPanelImage = encodePathAsUrl(
  __dirname,
  'static/required-status-check.svg'
)

interface ITutorialPanelProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository

  /** name of the configured external editor
   * (`undefined` if none is configured.)
   */
  readonly resolvedExternalEditor: string | null
  readonly currentTutorialStep: ValidTutorialStep
  readonly onExitTutorial: () => void
}

interface ITutorialPanelState {
  /** ID of the currently expanded tutorial step */
  readonly currentlyOpenSectionId: ValidTutorialStep
}

/** The Onboarding Tutorial Panel
 *  Renders a list of expandable tutorial steps (`TutorialListItem`).
 *  Enforces only having one step expanded at a time through
 *  event callbacks and local state.
 */
export class TutorialPanel extends React.Component<
  ITutorialPanelProps,
  ITutorialPanelState
> {
  public constructor(props: ITutorialPanelProps) {
    super(props)
    this.state = { currentlyOpenSectionId: this.props.currentTutorialStep }
  }

  private openTutorialFileInEditor = () => {
    this.props.dispatcher.openInExternalEditor(
      // TODO: tie this filename to a shared constant
      // for tutorial repos
      join(this.props.repository.path, 'README.md')
    )
  }

  private openPullRequest = () => {
    this.props.dispatcher.createPullRequest(this.props.repository)
  }

  private skipEditorInstall = () => {
    this.props.dispatcher.skipPickEditorTutorialStep(this.props.repository)
  }

  private skipCreatePR = () => {
    this.props.dispatcher.markPullRequestTutorialStepAsComplete(
      this.props.repository
    )
  }

  private isStepComplete = (step: ValidTutorialStep) => {
    return (
      orderedTutorialSteps.indexOf(step) <
      orderedTutorialSteps.indexOf(this.props.currentTutorialStep)
    )
  }

  private isStepNextTodo = (step: ValidTutorialStep) => {
    return step === this.props.currentTutorialStep
  }

  public componentWillReceiveProps(nextProps: ITutorialPanelProps) {
    if (this.props.currentTutorialStep !== nextProps.currentTutorialStep) {
      this.setState({
        currentlyOpenSectionId: nextProps.currentTutorialStep,
      })
    }
  }

  public render() {
    return (
      <div className="tutorial-panel-component panel">
        <div className="titleArea">
          <h3>开始</h3>
          <img src={TutorialPanelImage} alt="部分检查清单" />
        </div>
        <ol>
          <TutorialStepInstructions
            summaryText="安装文本编辑器"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.PickEditor}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            skipLinkButton={<SkipLinkButton onClick={this.skipEditorInstall} />}
            onSummaryClick={this.onStepSummaryClick}
          >
            {!this.isStepComplete(TutorialStep.PickEditor) ? (
              <>
                <p className="description">
                  看起来您没有安装文本编辑器. 我们可以推荐{' '}
                  <LinkButton
                    uri={suggestedExternalEditor.url}
                    title={`打开 ${suggestedExternalEditor.name} 网站`}
                  >
                    {suggestedExternalEditor.name}
                  </LinkButton>
                  {` 或者 `}
                  <LinkButton uri="https://atom.io" title="打开Atom网站">
                    Atom
                  </LinkButton>
                  , but feel free to use any.
                </p>
                <div className="action">
                  <LinkButton onClick={this.skipEditorInstall}>
                    我有一个编辑
                  </LinkButton>
                </div>
              </>
            ) : (
              <p className="description">
                默认编辑器为{' '}
                <strong>{this.props.resolvedExternalEditor}</strong>. 您可以在{' '}
                <LinkButton onClick={this.onPreferencesClick}>
                  {__DARWIN__ ? '设置' : '选项'}
                </LinkButton>
                中更改首选编辑器
              </p>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="创建分支"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.CreateBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              {`分支允许您同时处理存储库的不同版本. 
              通过进入顶部栏中的“分支”菜单并单击创建分支 "${
                __DARWIN__ ? '新建分支' : '新建分支'
              }".`}
            </p>
            <div className="action">
              <KeyboardShortcut
                darwinKeys={['⌘', '⇧', 'N']}
                keys={['Ctrl', 'Shift', 'N']}
              />
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="编辑文件"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.EditFile}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              在首选文本编辑器中打开此存储库。编辑
              {` `}
              <Ref>README.md</Ref>
              {` `}
              文件, 保存它, 然后回来.
            </p>
            {this.props.resolvedExternalEditor && (
              <div className="action">
                <Button onClick={this.openTutorialFileInEditor}>
                  {__DARWIN__ ? '打开编辑器' : '打开编辑器'}
                </Button>
                <KeyboardShortcut
                  darwinKeys={['⌘', '⇧', 'A']}
                  keys={['Ctrl', 'Shift', 'A']}
                />
              </div>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="做一个提交"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.MakeCommit}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              提交允许您保存更改集. 在左下角的 "描述" 区域, 写一条简短的消息,
              描述您所做的更改。完成后, 单击蓝色的提交按钮完成.
            </p>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="发布到GitHub"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.PushBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              发布将"推送"或上传你的提交到GitHub上的这个仓库分支.
              使用顶部栏中的第三个按钮发布.
            </p>
            <div className="action">
              <KeyboardShortcut darwinKeys={['⌘', 'P']} keys={['Ctrl', 'P']} />
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="打开一个拉取请求"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.OpenPullRequest}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            skipLinkButton={<SkipLinkButton onClick={this.skipCreatePR} />}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              拉取请求允许您对代码提出更改. 打开一个,
              就是要求某人审阅并合并它们. 由于这是一个演示存储库,
              因此此拉取请求将是私有的.
            </p>
            <div className="action">
              <Button onClick={this.openPullRequest}>
                {__DARWIN__ ? '打开拉取请求' : '打开拉取请求'}
                <Octicon symbol={OcticonSymbol.linkExternal} />
              </Button>
              <KeyboardShortcut darwinKeys={['⌘', 'R']} keys={['Ctrl', 'R']} />
            </div>
          </TutorialStepInstructions>
        </ol>
        <div className="footer">
          <Button onClick={this.props.onExitTutorial}>
            {__DARWIN__ ? '退出教程' : '退出教程'}
          </Button>
        </div>
      </div>
    )
  }
  /** this makes sure we only have one `TutorialListItem` open at a time */
  public onStepSummaryClick = (id: ValidTutorialStep) => {
    this.setState({ currentlyOpenSectionId: id })
  }

  private onPreferencesClick = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.Preferences,
      initialSelectedTab: PreferencesTab.Integrations,
    })
  }
}

const SkipLinkButton: React.FunctionComponent<{
  onClick: () => void
}> = props => <LinkButton onClick={props.onClick}>跳过</LinkButton>
