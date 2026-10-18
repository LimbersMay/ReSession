import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ToastService } from '../../toast.service';

/** Paints the toast of `ToastService`. The region always exists so screen readers announce changes. */
@Component({
  selector: 'app-toast',
  imports: [TranslocoDirective],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 're-toast-region re-toast-region--contained',
    'aria-live': 'polite',
  },
})
export class Toast {
  protected readonly toast = inject(ToastService);

  /** Zero or one message; tracked by id so every new toast gets a fresh element and timer bar. */
  protected readonly messages = computed(() => {
    const message = this.toast.current();
    return message ? [message] : [];
  });
}
