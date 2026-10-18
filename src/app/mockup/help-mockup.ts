import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

/**
 * Mockup of the help panel, a layer that covers the popup (D19).
 * Hand-written; guide step 08 replaces the whole component with HelpPanel.
 */
@Component({
  selector: 'app-help-mockup',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './help-mockup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'absolute inset-0 z-40 flex flex-col bg-background',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'helpTitle',
  },
})
export class HelpMockup {
  /** Asks the shell to close the panel. */
  public dismiss = output();
}
