import {Directive, input, output} from '@angular/core';

/**
 * Attaches accessible collapse/expand behavior to a tree group header.
 * Handles Click, Enter, and Space keys while safely ignoring interactions
 * triggered within the action button container (.re-tree__actions).
 */
@Directive({
  selector: '[appTreeHeadToggle]',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    '[attr.aria-expanded]': '!collapsed()',
    '(click)': 'onToggle($event)',
    '(keydown.enter)': 'onToggle($event)',
    '(keydown.space)': 'onToggle($event)',
  },
})
export class TreeHeadToggle {

  /** Mandatory collapse state from the parent container. */
  public collapsed = input.required<boolean>();

  /** Emitted when the header is toggled via click or keyboard. */
  public toggleCollapse = output<void>();

  protected onToggle(event: Event): void {
    const target = event.target as HTMLElement | null;

    // If events comes from the action button container, ignore it (the button handles its own events).
    if (target?.closest('.re-tree__actions')) {
      return;
    }

    // Prevent the default action of the event (e.g., scrolling for Space key).
    event.preventDefault();
    this.toggleCollapse.emit();
  }
}
