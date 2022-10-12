import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { SuggestedActionGroup } from '../suggested-actions'

const ClappingHandsImage = encodePathAsUrl(
  __dirname,
  'static/admin-mentoring.svg'
)

const TelescopeOcticon = <Octicon symbol={OcticonSymbol.telescope} />
const PlusOcticon = <Octicon symbol={OcticonSymbol.plus} />
const FileDirectoryOcticon = <Octicon symbol={OcticonSymbol.fileDirectory} />

interface ITutorialDoneProps {
  readonly dispatcher: Dispatcher

  /**
   * The currently selected repository
   */
  readonly repository: Repository
}
export class TutorialDone extends React.Component<ITutorialDoneProps, {}> {
  public render() {
    return (
      <div id="tutorial-done">
        <div className="content">
          <div className="header">
            <div className="text">
              <h1>你完成了!</h1>
              <p>
                您已经学习了如何使用GitHub Desktop的基本知识.
                下面是一些关于下一步做什么的建议.
              </p>
            </div>
            <img
              src={ClappingHandsImage}
              className="image"
              alt="Hands clapping"
            />
          </div>
          <SuggestedActionGroup>
            <SuggestedAction
              title="在GitHub上浏览项目"
              description="为您感兴趣的项目做出贡献"
              buttonText={__DARWIN__ ? '在浏览器中打开' : '在浏览器中打开'}
              onClick={this.openDotcomExplore}
              type="normal"
              image={TelescopeOcticon}
            />
            <SuggestedAction
              title="创建新存储库"
              description="开始一个全新的项目"
              buttonText={__DARWIN__ ? '创建存储库' : '创建存储库'}
              onClick={this.onCreateNewRepository}
              type="normal"
              image={PlusOcticon}
            />
            <SuggestedAction
              title="添加一个本地存储库"
              description="在GitHub Desktop上进行现有项目"
              buttonText={__DARWIN__ ? '添加存储库' : '添加存储库'}
              onClick={this.onAddExistingRepository}
              type="normal"
              image={FileDirectoryOcticon}
            />
          </SuggestedActionGroup>
        </div>
      </div>
    )
  }

  private openDotcomExplore = () => {
    this.props.dispatcher.showGitHubExplore(this.props.repository)
  }

  private onCreateNewRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
    })
  }

  private onAddExistingRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.AddRepository,
    })
  }
}
