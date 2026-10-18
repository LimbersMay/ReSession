import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { TranslocoDirective, translateSignal } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

type SiteList = 'whitelist' | 'blacklist';

/** Dictionary key of the line that explains each list. */
const LIST_HINT: Record<SiteList, string> = {
  whitelist: 'auto.whitelistHint',
  blacklist: 'auto.blacklistHint',
};

/**
 * Mockup of view 3, "Auto": the timer card and the timer's site lists.
 * Hand-written; guide step 07 replaces the whole component with AutoView.
 */
@Component({
  selector: 'app-auto-mockup',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './auto-mockup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 're-scroll flex flex-1 flex-col gap-4 p-4' },
})
export class AutoMockup {
  /** Carries an already translated message for the shell's toast. */
  public notify = output<string>();

  protected readonly isTimerOn = signal(true);
  protected readonly list = signal<SiteList>('whitelist');
  protected readonly isWhitelist = computed(() => this.list() === 'whitelist');
  protected readonly listHint = translateSignal(computed(() => LIST_HINT[this.list()]));

  protected toggleTimer(): void {
    this.isTimerOn.update((isOn) => !isOn);
  }
}
