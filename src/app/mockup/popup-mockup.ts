import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { ConfirmDialog } from '../feedback/components/confirm-dialog/confirm-dialog';
import { Toast } from '../feedback/components/toast/toast';
import { ConfirmService } from '../feedback/confirm.service';
import { ToastService } from '../feedback/toast.service';
import { AutoMockup } from './auto-mockup';
import { EditorMockup } from './editor-mockup';
import { GlobalMockup } from './global-mockup';
import { HelpMockup } from './help-mockup';
import { TabMockup } from './tab-mockup';

type View = 'tab' | 'global' | 'auto';
type Language = 'es' | 'en';
type Theme = 'light' | 'dark' | 'system';

/**
 * Mockup of the popup shell (540×600): header, settings menu, the current view, status bar
 * and the layers above them.
 *
 * A visual reference with basic interactivity only. Guide steps replace its blocks and child
 * mockups with real components until `App` takes its place (step 08).
 */
@Component({
  selector: 'app-popup-mockup',
  imports: [
    NgIcon,
    TranslocoDirective,
    TabMockup,
    GlobalMockup,
    AutoMockup,
    HelpMockup,
    EditorMockup,
    Toast,
    ConfirmDialog,
  ],
  templateUrl: './popup-mockup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 're-app',
    '(document:keydown.escape)': 'closeTop()',
  },
})
export class PopupMockup {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly view = signal<View>('tab');
  /** The view of automatic runs has no cookie to add. */
  protected readonly canAddCookie = computed(() => this.view() !== 'auto');

  protected readonly isMenuOpen = signal(false);
  protected readonly language = signal<Language>('es');
  protected readonly theme = signal<Theme>('system');
  private readonly prefersDark = signal(false);
  private readonly isDark = computed(
    () => this.theme() === 'dark' || (this.theme() === 'system' && this.prefersDark()),
  );

  protected readonly isEditorOpen = signal(false);
  /** Whether the editor opens empty (Add) or with an existing cookie (pencil). */
  protected readonly isNewCookie = signal(false);
  protected readonly isHelpOpen = signal(false);

  constructor() {
    this.watchSystemTheme();

    // Phase 2 stores the language and the theme; here they only live while the popup is open.
    effect(() => {
      const language = this.language();
      this.transloco.setActiveLang(language);
      this.document.documentElement.lang = language;
    });
    effect(() => this.document.documentElement.classList.toggle('dark', this.isDark()));
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected addCookie(): void {
    this.openEditor(true);
  }

  protected editCookie(): void {
    this.openEditor(false);
  }

  protected openHelp(): void {
    this.isMenuOpen.set(false);
    this.isHelpOpen.set(true);
  }

  protected async askConfirm(): Promise<void> {
    const ok = await this.confirmService.ask({
      title: this.transloco.translate('confirm.deleteTitle', { name: 'user_session' }),
      lead: this.transloco.translate('confirm.lockedLead'),
      message: this.transloco.translate('confirm.deleteLockedMessage'),
      verb: this.transloco.translate('common.delete'),
      isDestructive: true,
    });
    if (!ok) return;
    this.isEditorOpen.set(false);
    this.showToast(this.transloco.translate('toast.removed', { name: 'user_session' }));
  }

  /** Saving or confirming a delete closes the editor as well, as the real flows will. */
  protected saveCookie(message: string): void {
    this.isEditorOpen.set(false);
    this.showToast(message);
  }

  /** Shows an already translated message; a new one replaces the current one and its timer. */
  protected showToast(message: string): void {
    this.isMenuOpen.set(false);
    this.toastService.show(message);
  }

  /** Esc closes only the layer on top: confirmation, then editor, then help, then the menu. */
  protected closeTop(): void {
    if (this.confirmService.current()) this.confirmService.answer(false);
    else if (this.isEditorOpen()) this.isEditorOpen.set(false);
    else if (this.isHelpOpen()) this.isHelpOpen.set(false);
    else this.isMenuOpen.set(false);
  }

  private openEditor(isNew: boolean): void {
    this.isMenuOpen.set(false);
    this.isNewCookie.set(isNew);
    this.isEditorOpen.set(true);
  }

  /** The "system" theme follows the OS, also when it changes while the popup is open. */
  private watchSystemTheme(): void {
    const media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    if (!media) return;
    this.prefersDark.set(media.matches);
    const onChange = (event: MediaQueryListEvent) => this.prefersDark.set(event.matches);
    media.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
  }
}
