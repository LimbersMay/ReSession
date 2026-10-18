import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {NgIcon} from '@ng-icons/core';
import {translateSignal, TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {StorageEntry} from '../../../../engine/models';
import {decodeJwtPayload, detectFormat, ValueFormat} from '../../../../engine/format';
import {formatRelativeTime} from '../../../shared/locale-format';

@Component({
  selector: 'app-storage-item',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './storage-item.html',
  styleUrl: './storage-item.sass',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 're-tree__row re-tree__row--2line re-reveal-host'
  }
})
export class StorageItem {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = this.transloco.activeLang;

  public entry = input.required<StorageEntry>();
  public selected = input(false);

  public toggleSelect = output<void>();
  public copyValue = output<string>();
  public remove = output<void>();

  /** Temporary property to hold the translated value of the entry. */
  protected readonly isDecoded = signal(false);

  protected readonly format = computed<ValueFormat | null>(() =>
    detectFormat(this.entry().value)
  );

  private readonly payload = computed<Record<string, unknown> | null>(() =>
    this.format() === 'JWT' ? decodeJwtPayload(this.entry().value) : null
  );

  protected readonly canDecode = computed(() => this.payload() !== null);

  private readonly expiresAt = computed<number | null>(() => {
    const exp = this.payload()?.['exp'];
    return typeof exp === 'number' ? exp * 1000 : null;
  });

  protected readonly hasExpiry = computed(() => this.expiresAt() !== null);
  protected readonly isExpired = computed(() => {
    const expiresAt = this.expiresAt();
    return expiresAt !== null && Date.now() > expiresAt;
  });

  protected readonly expiryHint = translateSignal(
    computed(() => (this.isExpired() ? 'storage.expired' : 'storage.expiresIn')),
    computed(() => ({
      when: this.expiresAt() ? formatRelativeTime(this.expiresAt()!, this.lang()) : '',
    }))
  );

  protected readonly shownValue = computed<string>(() => {
    if (this.isDecoded() && this.payload()) {
      return JSON.stringify(this.payload());
    }
    return this.entry().value;
  });

  protected readonly decodeLabel = translateSignal(
    computed(() => (this.isDecoded() ? 'storage.viewOriginal' : 'storage.viewDecoded'))
  );

  protected toggleDecoded(): void {
    this.isDecoded.update((v) => !v);
  }
}
