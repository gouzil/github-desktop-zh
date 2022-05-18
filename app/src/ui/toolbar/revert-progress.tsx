import * as React from 'react'
import { IRevertProgress } from '../../models/progress'
import { ToolbarButton, ToolbarButtonStyle } from './button'
import { syncClockwise } from '../octicons'

interface IRevertProgressProps {
  /** Progress information associated with the current operation */
  readonly progress: IRevertProgress
}

/** Display revert progress in the toolbar. */
export class RevertProgress extends React.Component<IRevertProgressProps, {}> {
  public render() {
    const progress = this.props.progress
    const title = progress.title || 'Hang on…'
    return (
      <ToolbarButton
        title="Reverting…"
        description={title}
        progressValue={progress.value}
        className="revert-progress"
        icon={syncClockwise}
        iconClassName="spin"
        style={ToolbarButtonStyle.Subtitle}
        disabled={true}
      />
    )
  }
}
