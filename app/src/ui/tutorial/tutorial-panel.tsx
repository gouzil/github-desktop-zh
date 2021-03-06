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
          <h3>??????</h3>
          <img src={TutorialPanelImage} />
        </div>
        <ol>
          <TutorialStepInstructions
            summaryText="?????????????????????"
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
                  ???????????????????????????????????????. ??????????????????{' '}
                  <LinkButton
                    uri={suggestedExternalEditor.url}
                    title={`?????? ${suggestedExternalEditor.name} ??????`}
                  >
                    {suggestedExternalEditor.name}
                  </LinkButton>
                  {` ?????? `}
                  <LinkButton uri="https://atom.io" title="??????Atom??????">
                    Atom
                  </LinkButton>
                  , but feel free to use any.
                </p>
                <div className="action">
                  <LinkButton onClick={this.skipEditorInstall}>
                    ??????????????????
                  </LinkButton>
                </div>
              </>
            ) : (
              <p className="description">
                ??????????????????{' '}
                <strong>{this.props.resolvedExternalEditor}</strong>. ????????????{' '}
                <LinkButton onClick={this.onPreferencesClick}>
                  {__DARWIN__ ? '?????????' : '??????'}
                </LinkButton>
                ????????????????????????
              </p>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="????????????"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.CreateBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              {`???????????????????????????????????????????????????. 
              ?????????????????????????????????????????????????????????????????? "${
                __DARWIN__ ? '????????????' : '????????????'
              }".`}
            </p>
            <div className="action">
              {__DARWIN__ ? (
                <>
                  <kbd>???</kbd>
                  <kbd>???</kbd>
                  <kbd>N</kbd>
                </>
              ) : (
                <>
                  <kbd>Ctrl</kbd>
                  <kbd>Shift</kbd>
                  <kbd>N</kbd>
                </>
              )}
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="????????????"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.EditFile}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              ??????????????????????????????????????????????????????
              {` `}
              <Ref>README.md</Ref>
              {` `}
              ??????, ?????????, ????????????.
            </p>
            {this.props.resolvedExternalEditor && (
              <div className="action">
                <Button onClick={this.openTutorialFileInEditor}>
                  {__DARWIN__ ? '???????????????' : '???????????????'}
                </Button>
                {__DARWIN__ ? (
                  <>
                    <kbd>???</kbd>
                    <kbd>???</kbd>
                    <kbd>A</kbd>
                  </>
                ) : (
                  <>
                    <kbd>Ctrl</kbd>
                    <kbd>Shift</kbd>
                    <kbd>A</kbd>
                  </>
                )}
              </div>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="???????????????"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.MakeCommit}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              ??????????????????????????????. ??????????????? "??????" ??????, ????????????????????????,
              ????????????????????????????????????, ?????????????????????????????????.
            </p>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="?????????GitHub"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.PushBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              ?????????"??????"????????????????????????GitHub????????????????????????.
              ??????????????????????????????????????????.
            </p>
            <div className="action">
              {__DARWIN__ ? (
                <>
                  <kbd>???</kbd>
                  <kbd>P</kbd>
                </>
              ) : (
                <>
                  <kbd>Ctrl</kbd>
                  <kbd>P</kbd>
                </>
              )}
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="????????????????????????"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.OpenPullRequest}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            skipLinkButton={<SkipLinkButton onClick={this.skipCreatePR} />}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              ??????????????????????????????????????????. ????????????,
              ???????????????????????????????????????. ?????????????????????????????????,
              ????????????????????????????????????.
            </p>
            <div className="action">
              <Button onClick={this.openPullRequest}>
                {__DARWIN__ ? '??????????????????' : '??????????????????'}
                <Octicon symbol={OcticonSymbol.linkExternal} />
              </Button>
              {__DARWIN__ ? (
                <>
                  <kbd>???</kbd>
                  <kbd>R</kbd>
                </>
              ) : (
                <>
                  <kbd>Ctrl</kbd>
                  <kbd>R</kbd>
                </>
              )}
            </div>
          </TutorialStepInstructions>
        </ol>
        <div className="footer">
          <Button onClick={this.props.onExitTutorial}>
            {__DARWIN__ ? '????????????' : '????????????'}
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
      initialSelectedTab: PreferencesTab.Advanced,
    })
  }
}

const SkipLinkButton: React.FunctionComponent<{
  onClick: () => void
}> = props => <LinkButton onClick={props.onClick}>??????</LinkButton>
