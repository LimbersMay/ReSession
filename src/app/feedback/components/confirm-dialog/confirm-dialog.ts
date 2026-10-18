import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ConfirmService } from '../../confirm.service';

/** Paints the question of `ConfirmService` and answers it. Esc is handled by the shell. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  private readonly document = inject(DOCUMENT);

  protected readonly confirm = inject(ConfirmService);
  protected readonly request = this.confirm.current;

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  /** Element focused when the question opened; gets the focus back when it closes. */
  private opener: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      const request = this.request();
      const cancel = this.cancelButton();
      if (request && cancel && !this.opener) {
        this.opener = this.document.activeElement as HTMLElement | null;
        // Focus starts on the safe option: an impulsive Enter cancels instead of deleting.
        cancel.nativeElement.focus();
      } else if (!request && this.opener) {
        if (this.opener.isConnected) this.opener.focus();
        this.opener = null;
      }
    });
  }

  /** With two buttons, Tab and Shift+Tab just alternate between them: focus never leaves. */
  protected onTab(event: Event): void {
    event.preventDefault();
    const cancel = this.cancelButton()?.nativeElement;
    const confirm = this.confirmButton()?.nativeElement;
    if (this.document.activeElement === cancel) confirm?.focus();
    else cancel?.focus();
  }
}
