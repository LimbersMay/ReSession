import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TranslocoDirective, translateSignal} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {Cookie} from '../../../../engine/models';

/**
 * One cookie row of the tree.
 *
 * Presentational only: it renders the cookie and emits what the user wants to do.
 * The parent container resolves every operation. The row indent comes from the group's
 * `--re-tree-depth`, so the row does not need to know its depth.
 */
@Component({
  selector: 'app-cookie-item',
  imports: [
    NgIcon,
    TranslocoDirective
  ],
  templateUrl: './cookie-item.html',
  styleUrl: './cookie-item.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 're-tree__row re-reveal-host',
    '[class.re-tree__row--danger]': 'danger()'
  }
})
export class CookieItem {
  public cookie = input.required<Cookie>();
  /** Shows the closed lock and the name in bold. */
  public locked = input(false);
  public selected = input(false);
  /** Applies the tracker tint on hover. */
  public danger = input(false);
  /**
   * Tracker name. When set, a pill replaces the H/S badges and the domain replaces the value,
   * because a tracker group mixes domains and the value says nothing.
   */
  public tag = input<string | null>(null);

  public toggleSelect = output();
  public toggleLock = output();
  public edit = output();
  public remove = output();

  /** Lock button label: what pressing it will do. */
  protected readonly lockLabel = translateSignal(
    computed(() => (this.locked() ? 'cookies.unlock' : 'cookies.lock'))
  );
  protected readonly lockIcon = computed(() => (this.locked() ? 'lucideLock' : 'lucideLockOpen'));
  /** Second column: the value, or the domain when the row carries a tracker name. */
  protected readonly detail = computed(() => (this.tag() ? this.cookie().domain : this.cookie().value));
}
