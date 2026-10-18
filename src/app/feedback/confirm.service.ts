import { Injectable, signal } from '@angular/core';
import { ConfirmRequest } from './models';

/** Holds the open confirmation question; `ConfirmDialog` paints it and answers it. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly request = signal<ConfirmRequest | null>(null);
  /** Settles the promise of the open question. */
  private resolve: ((ok: boolean) => void) | null = null;

  readonly current = this.request.asReadonly();

  /** Asks the question and resolves with the answer. A question already open is answered `false`. */
  ask(request: ConfirmRequest): Promise<boolean> {
    if (this.resolve) this.answer(false);
    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
      this.request.set(request);
    });
  }

  /** Clears the question first and resolves after, so the asker can ask again right away. */
  answer(ok: boolean): void {
    const resolve = this.resolve;
    this.request.set(null);
    this.resolve = null;
    resolve?.(ok);
  }
}
