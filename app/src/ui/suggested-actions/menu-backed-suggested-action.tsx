import * as React from 'react'
import { SuggestedAction } from './suggested-action'
import { MenuIDs } from '../../models/menu-ids'
import { executeMenuItemById } from '../main-process-proxy'

interface IMenuBackedSuggestedActionProps {
  /**
   * The id of the menu item backing this action.
   * When the action is invoked the menu item specified
   * by this id will be executed.
   */
  readonly menuItemId: MenuIDs

  /**
   * The title, or "header" text for a suggested
   * action.
   */
  readonly title: string

  /**
   * An optional description to be rendered directly
   * underneath the title.
   */
  readonly description?: string | JSX.Element

  /**
   * A text or set of elements used to present information
   * to the user about how and where to access the action
   * outside of the suggested action.
   */
  readonly discoverabilityContent: string | JSX.Element

  /**
   * The text, or "label", for the action button.
   */
  readonly buttonText: string | JSX.Element

  /**
   * The type of action, currently supported actions are
   * normal, and primary. Primary actions are visually
   * distinct from normal actions in order to stand out
   * as a highly probable next step action.
   */
  readonly type?: 'normal' | 'primary'

  /**
   * Whether or not the action should be disabled. Disabling
   * the action means that the button will no longer be
   * clickable.
   */
  readonly disabled?: boolean

  /**
   * A callback which is invoked when the user clicks
   * or activates the action using their keyboard.
   *
   * In order to suppress the menu backed action from being invoked
   * consumers of this event will need to suppress the default behavior
   * by calling `e.preventDefault`.
   */
  readonly onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * A small container component for rendering an "action" in a
 * suggested actions view. An action is usually contained within an action group
 * which visually connects one or more actions. An action component
 * has a title, a description, and a button label.
 *
 * A menu backed suggested action differs from a normal suggested
 * action in that it's directly linked to a menu item in the
 * application menu and invoking a menu backed action will execute
 * the menu item backing it without a need for consumers to specify
 * an onClick callback.
 */
export class MenuBackedSuggestedAction extends React.Component<
  IMenuBackedSuggestedActionProps,
  {}
> {
  public render() {
    return (
      <SuggestedAction
        title={this.props.title}
        description={this.props.description}
        discoverabilityContent={this.props.discoverabilityContent}
        buttonText={this.props.buttonText}
        onClick={this.onClick}
        type={this.props.type}
        disabled={this.props.disabled}
      />
    )
  }

  private onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.props.onClick !== undefined) {
      this.props.onClick(e)
    }

    if (!e.defaultPrevented) {
      executeMenuItemById(this.props.menuItemId)
    }
  }
}
