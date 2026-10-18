import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { TranslocoDirective, translateSignal } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

/** Every collapsible group of the hand-written tree: site → domain → cookie. */
const GROUP_KEYS = ['g-github', 'g-github-root', 'g-github-gist', 'g-trackers', 'g-doubleclick'];

/**
 * Mockup of view 2, "Global": every cookie of the browser grouped by site and domain.
 * Hand-written; guide step 06 replaces the whole component with GlobalView.
 */
@Component({
  selector: 'app-global-mockup',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './global-mockup.html',
  styleUrl: './global-mockup.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class GlobalMockup {
  /** Asks the shell to open the editor with a cookie. */
  public editCookie = output();
  /** Asks the shell for the delete confirmation. */
  public askConfirm = output();
  /** Carries an already translated message for the shell's toast. */
  public notify = output<string>();

  /** Every group starts folded so the whole view fits at a glance. */
  protected readonly collapsedKeys = signal<ReadonlySet<string>>(new Set(GROUP_KEYS));

  private readonly rootShort = translateSignal('cookies.group.rootShort');
  private readonly hostShort = translateSignal('cookies.group.hostShort');
  protected readonly rootMeta = translateSignal(
    'cookies.nestedMeta',
    computed(() => ({ kind: this.rootShort(), count: 4 })),
  );
  protected readonly hostMeta = translateSignal(
    'cookies.nestedMeta',
    computed(() => ({ kind: this.hostShort(), count: 3 })),
  );

  private readonly siteRemoved = translateSignal('toast.removedMany', { count: 2 });
  private readonly siteKept = translateSignal('toast.keptMany', { count: 5 });
  private readonly hostRemoved = translateSignal('toast.removedMany', { count: 2 });
  private readonly hostKept = translateSignal('toast.keptOne', { count: 1 });
  /** Clean results of the site and of its subdomain, joined as the real summary will join them. */
  protected readonly siteCleanSummary = computed(() => `${this.siteRemoved()} · ${this.siteKept()}`);
  protected readonly hostCleanSummary = computed(() => `${this.hostRemoved()} · ${this.hostKept()}`);

  protected isCollapsed(key: string): boolean {
    return this.collapsedKeys().has(key);
  }

  protected toggleCollapsed(key: string): void {
    this.collapsedKeys.update((keys) => {
      const next = new Set(keys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Unfolds everything when all groups are folded; otherwise folds them all. */
  protected toggleAllCollapsed(): void {
    const areAllCollapsed = GROUP_KEYS.every((key) => this.isCollapsed(key));
    this.collapsedKeys.set(new Set(areAllCollapsed ? [] : GROUP_KEYS));
  }

  /** "Clean" sits on a group head: the click must not fold the group. */
  protected onCleanGroup(event: Event, message: string): void {
    event.stopPropagation();
    this.notify.emit(message);
  }
}
