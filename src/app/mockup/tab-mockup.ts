import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { TranslocoDirective, translateSignal } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { CookieContainer } from '../cookies/components/cookie-container/cookie-container';
import {MOCK_LOCKED_IDS, MOCK_STORAGE_ENTRIES, MOCK_TAB_GROUPS, MOCK_TAB_ORIGIN} from '../mock-data';
import {StorageContainer} from '../tab/components/storage-container/storage-container';

type TabType = 'cookies' | 'storage';

/** Number of storage keys the hand-written storage tree shows. */
const STORAGE_KEY_COUNT = 3;

/** Every collapsible group of this view: the cookie groups and the two storage areas. */
const GROUP_KEYS = [...MOCK_TAB_GROUPS.map((group) => group.key), 'st-local', 'st-session'];

/**
 * Mockup of view 1, "This tab": search, the Cookies/Storage switch, the batch bar and the two
 * trees. The cookie tree is already real (guide step 01); the rest is hand-written.
 */
@Component({
  selector: 'app-tab-mockup',
  imports: [NgIcon, TranslocoDirective, CookieContainer, StorageContainer],
  templateUrl: './tab-mockup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class TabMockup {
  /** Asks the shell for the delete confirmation. */
  public askConfirm = output();
  /** Carries an already translated message for the shell's toast. */
  public notify = output<string>();

  protected readonly tabGroups = MOCK_TAB_GROUPS;
  protected readonly lockedIds = MOCK_LOCKED_IDS;
  protected readonly cookieCount = MOCK_TAB_GROUPS.reduce((n, group) => n + group.cookies.length, 0);
  protected readonly storageCount = STORAGE_KEY_COUNT;

  protected readonly tabOrigin = MOCK_TAB_ORIGIN;
  protected readonly localStorageEntries = MOCK_STORAGE_ENTRIES.filter((e) => e.area === 'local');
  protected readonly sessionStorageEntries = MOCK_STORAGE_ENTRIES.filter((e) => e.area === 'session');

  protected readonly tabType = signal<TabType>('cookies');
  protected readonly isCookies = computed(() => this.tabType() === 'cookies');
  /** What "Select all" would select: the items of the active tree. */
  protected readonly itemCount = computed(() =>
    this.isCookies() ? this.cookieCount : this.storageCount,
  );

  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  /** Every group starts folded so the whole view fits at a glance. */
  protected readonly collapsedKeys = signal<ReadonlySet<string>>(new Set(GROUP_KEYS));

  private readonly removed = translateSignal('toast.removedMany', { count: 5 });
  private readonly kept = translateSignal('toast.keptMany', { count: 3 });
  /** The two halves of a clean result, joined as the real summary will join them. */
  protected readonly cleanSummary = computed(() => `${this.removed()} · ${this.kept()}`);

  protected isCollapsed(key: string): boolean {
    return this.collapsedKeys().has(key);
  }

  /** Adds or removes a cookie id, with a new Set so the signal notices. */
  protected toggleSelected(id: string): void {
    this.selectedIds.update((ids) => toggle(ids, id));
  }

  protected toggleCollapsed(key: string): void {
    this.collapsedKeys.update((keys) => toggle(keys, key));
  }

  /** Unfolds everything when all groups are folded; otherwise folds them all. */
  protected toggleAllCollapsed(): void {
    const areAllCollapsed = GROUP_KEYS.every((key) => this.isCollapsed(key));
    this.collapsedKeys.set(new Set(areAllCollapsed ? [] : GROUP_KEYS));
  }

  /** "Empty" sits on a group head: the click must not fold the group. */
  protected onEmpty(event: Event): void {
    event.stopPropagation();
    this.askConfirm.emit();
  }
}

/** A copy of `set` with `value` added, or removed if it was already there. */
function toggle(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
