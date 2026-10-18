import { Injectable, signal } from '@angular/core';
import { ToastMessage } from './models';

/** How long a toast stays, in milliseconds (ReDesign, ReToast). */
export const TOAST_DURATION = { plain: 3000, withUndo: 5000 };

/** Holds the visible toast; one at a time, a new one replaces the previous and its undo. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly message = signal<ToastMessage | null>(null);
  private nextId = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly current = this.message.asReadonly();

  show(text: string, options: { undo?: () => void; duration?: number } = {}): void {
    const { undo, duration } = options;
    const message: ToastMessage = {
      id: ++this.nextId,
      text,
      duration: duration ?? (undo ? TOAST_DURATION.withUndo : TOAST_DURATION.plain),
      undo,
    };
    this.message.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dismiss(), message.duration);
  }

  /** Dismisses first and runs the undo after, so an undo that shows a toast keeps it. */
  undo(): void {
    const undo = this.message()?.undo;
    this.dismiss();
    undo?.();
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.message.set(null);
  }
}
