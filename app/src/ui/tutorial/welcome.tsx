import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>欢迎来到 GitHub Desktop</h1>
          <p>使用本教程来熟悉Git、GitHub和GitHub Desktop.</p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} />
            <p>
              <strong>Git</strong> 是版本控制系统.
            </p>
          </li>
          <li>
            <img src={TeamDiscussionImage} />
            <p>
              <strong>GitHub</strong> 是存储代码并与他人协作的地方.
            </p>
          </li>
          <li>
            <img src={CloudServerImage} />
            <p>
              <strong>GitHub Desktop</strong> 帮助你在本地使用GitHub.
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
