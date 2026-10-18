import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {StorageArea, StorageEntry} from '../../../../engine/models';
import {translateSignal, TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {ToastService} from '../../../feedback/toast.service';
import {formatBytes} from '../../../shared/locale-format';
import {entryBytes} from '../../../../engine/format';
import {TreeHeadToggle} from '../../../shared/directives/tree-head-toggle';
import {NgIcon} from '@ng-icons/core';
import {StorageItem} from '../storage-item/storage-item';

interface StorageRow {
  entry: StorageEntry;
  selected: boolean;
}

const AREA_HEAD: Record<StorageArea, { label: string; icon: string }> = {
  local: { label: 'LocalStorage', icon: 'lucideDatabase' },
  session: { label: 'SessionStorage', icon: 'lucideDatabaseZap' },
}

@Component({
  selector: 'app-storage-container',
  standalone: true,
  imports: [
    TranslocoDirective,
    TreeHeadToggle,
    NgIcon,
    StorageItem
  ],
  templateUrl: './storage-container.html',
  styleUrl: './storage-container.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 're-tree__group block'
  }
})
export class StorageContainer {
  private readonly toast = inject(ToastService);
  private transloco = inject(TranslocoService);
  private readonly lang = this.transloco.activeLang;

  public area = input.required<StorageArea>();
  public origin = input.required<string>();
  public entries = input.required<StorageEntry[]>();
  public selectedIds = input<ReadonlySet<string>>(new Set());
  public collapsed = input(false);

  public toggleSelect = output<string>();
  public toggleCollapse = output<void>();

  protected readonly label = computed(() => AREA_HEAD[this.area()].label);
  protected readonly icon = computed(() => AREA_HEAD[this.area()].icon);
  protected readonly count = computed(() => this.entries().length);
  protected readonly hasEntries = computed(() => this.count() > 0);

  private readonly size = computed(() => {
    const totalBytes = this.entries().reduce((acc, e) => acc + entryBytes(e), 0);
    return formatBytes(totalBytes, this.lang());
  });

  protected readonly summary = translateSignal(
    computed(() => (this.count() === 1 ? 'storage.keysOne' : 'storage.keysMany')),
    computed(() => ({ count: this.count(), size: this.size() }))
  );

  private readonly copiedText = translateSignal('toast.copied');
  private readonly copyFailedText = translateSignal('toast.copyFailed');

  protected readonly rows = computed<StorageRow[]>(() =>
    this.entries().map((entry) => ({
      entry,
      selected: this.selectedIds().has(entry.id),
    }))
  );

  protected async onCopyValue(value: string): Promise<void> {
    try {
      // Copy original value
      console.log(value);
      await navigator.clipboard.writeText(value);
      this.toast.show(this.copiedText());
    } catch {
      this.toast.show(this.copyFailedText());
    }
  }
}
