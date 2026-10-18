import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TranslocoDirective, translateSignal} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {Cookie, CookieGroup, CookieGroupKind} from '../../../../engine/models';
import {trackerName} from '../../../../engine/trackers';
import {CookieItem} from '../cookie-item/cookie-item';
import {TreeHeadToggle} from '../../../shared/directives/tree-head-toggle';

/**
 * Which action the head shows: the whitelist pill, the always visible tracker clean button,
 * or the clean button that appears on hover.
 */
type HeadAction = 'whitelisted' | 'cleanTrackers' | 'clean';

/** What one `CookieItem` receives. */
interface CookieRow {
  cookie: Cookie;
  locked: boolean;
  selected: boolean;
  tag: string | null;
}

/**
 * Dictionary keys of the head texts per kind. Being a `Record`, adding a kind
 * does not compile until it has its texts.
 */
const KIND_TEXT: Record<CookieGroupKind, { label: string; short: string }> = {
  host: { label: 'cookies.group.host', short: 'cookies.group.hostShort' },
  root: { label: 'cookies.group.root', short: 'cookies.group.rootShort' },
  trackers: { label: 'cookies.group.trackers', short: 'cookies.group.trackersShort' },
};

/** Head icon per kind at depth 0. Nested groups always use a folder. */
const KIND_ICON: Record<CookieGroupKind, string> = {
  host: 'lucideFolder',
  root: 'lucideGlobe',
  trackers: 'lucideShieldAlert',
};

/**
 * A collapsible group of cookies, at any depth of the tree.
 *
 * Renders the head and one `CookieItem` per cookie. Selection and collapse belong to the view,
 * so they come in as inputs and go out as events.
 */
@Component({
  selector: 'app-cookie-container',
  imports: [
    NgIcon,
    TranslocoDirective,
    CookieItem,
    TreeHeadToggle
  ],
  templateUrl: './cookie-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block',
    '[class.re-tree__group]': '!isNested()',
    '[style.--re-tree-depth]': 'depth()'
  }
})
export class CookieContainer {
  public group = input.required<CookieGroup>();
  /** 0 at the top of the tree, 1 inside another group, and so on without limit. */
  public depth = input(0);
  public lockedIds = input<ReadonlySet<string>>(new Set());
  public selectedIds = input<ReadonlySet<string>>(new Set());
  public collapsed = input(false);

  /** Carries the id of the cookie to select or deselect. */
  public toggleSelect = output<string>();
  public toggleCollapse = output();

  protected readonly isNested = computed(() => this.depth() > 0);
  /** Every row of a trackers group gets the danger tint, at any depth. */
  protected readonly isTrackers = computed(() => this.group().kind === 'trackers');
  /** The top trackers group of a tab: it mixes domains, so each row names its tracker. */
  protected readonly isTrackerList = computed(() => this.isTrackers() && !this.isNested());
  protected readonly count = computed(() => this.group().cookies.length);

  protected readonly icon = computed(() =>
    this.isNested() ? 'lucideFolder' : KIND_ICON[this.group().kind]
  );

  protected readonly headAction = computed<HeadAction>(() => {
    if (this.group().whitelistedBy) return 'whitelisted';
    return this.isTrackerList() ? 'cleanTrackers' : 'clean';
  });

  /** Only the plain clean button hides until hover. */
  protected readonly revealsAction = computed(() => this.headAction() === 'clean');

  private readonly kindLabel = translateSignal(computed(() => KIND_TEXT[this.group().kind].label));
  private readonly kindShort = translateSignal(computed(() => KIND_TEXT[this.group().kind].short));
  private readonly mixedDomains = translateSignal('cookies.group.trackersMeta');
  private readonly nestedMeta = translateSignal(
    'cookies.nestedMeta',
    computed(() => ({ kind: this.nestedKind(), count: this.count() }))
  );

  /** Depth 0 names the kind of group; a nested group names its domain. */
  protected readonly title = computed(() =>
    this.isNested() ? this.group().domain : this.kindLabel()
  );

  /** Depth 0 shows the domain; a nested group shows its kind and count. */
  protected readonly meta = computed(() =>
    this.isNested() ? this.nestedMeta() : (this.group().domain ?? this.mixedDomains())
  );

  protected readonly rows = computed<CookieRow[]>(() =>
    this.group().cookies.map((cookie) => ({
      cookie,
      locked: this.lockedIds().has(cookie.id),
      selected: this.selectedIds().has(cookie.id),
      tag: this.isTrackerList() ? trackerName(cookie.domain) : null,
    }))
  );

  /**
   * Short kind of a nested group: the tracker that owns its domain, or the generic text
   * of its kind when the domain is not a known tracker.
   */
  private nestedKind(): string {
    const { domain } = this.group();
    const tracker = this.isTrackers() && domain ? trackerName(domain) : null;
    return tracker ?? this.kindShort();
  }

  /** Click, Enter or Space on the head. Prevents the default so Space does not scroll. */
  protected onHeadToggle(event: Event): void {
    event.preventDefault();
    this.toggleCollapse.emit();
  }
}
