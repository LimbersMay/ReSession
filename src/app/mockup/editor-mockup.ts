import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService, translateSignal } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

type ValueMode = 'raw' | 'decoded';
type ExpiryMode = 'session' | 'date';
type SameSite = 'Lax' | 'Strict' | 'None';

/** Dictionary key of the hint under the SameSite switch, per value. */
const SAME_SITE_HINT: Record<SameSite, string> = {
  Lax: 'editor.sameSiteLax',
  Strict: 'editor.sameSiteStrict',
  None: 'editor.sameSiteNone',
};

/** Example fields: the Add button opens an empty name on the current subdomain. */
const NEW_EXAMPLE = { name: '', domain: 'gist.github.com' };
const EDIT_EXAMPLE = { name: 'user_session', domain: '.github.com' };

/** The example expiry date, the same one the date field shows. */
const EXAMPLE_EXPIRY = new Date(2026, 9, 31, 8, 0);

/**
 * Mockup of the cookie editor dialog, for a new cookie or an existing one.
 * Hand-written; guide step 09 replaces the whole component with CookieEditor.
 */
@Component({
  selector: 'app-editor-mockup',
  imports: [NgIcon, TranslocoDirective],
  templateUrl: './editor-mockup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 're-dialog-overlay re-dialog-overlay--contained',
    '(click)': 'dismiss.emit()',
  },
})
export class EditorMockup {
  private readonly transloco = inject(TranslocoService);

  /** Opened from Add (empty form) rather than from a cookie's pencil. */
  public isNew = input(false);

  /** Asks the shell to close the dialog without saving. */
  public dismiss = output();
  public save = output();
  /** Asks the shell for the delete confirmation. */
  public remove = output();
  /** Carries an already translated message for the shell's toast. */
  public notify = output<string>();

  protected readonly isEditing = computed(() => !this.isNew());
  protected readonly example = computed(() => (this.isNew() ? NEW_EXAMPLE : EDIT_EXAMPLE));
  protected readonly title = translateSignal(
    computed(() => (this.isNew() ? 'editor.titleNew' : 'editor.titleEdit')),
  );

  protected readonly valueMode = signal<ValueMode>('raw');
  private readonly rawLabel = translateSignal('editor.raw');
  protected readonly decodedHint = translateSignal(
    'editor.decodedHint',
    computed(() => ({ raw: this.rawLabel() })),
  );

  protected readonly expiryMode = signal<ExpiryMode>('date');
  private readonly language = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  /** The example date in the active language's long format. */
  protected readonly expiryDate = computed(() =>
    new Intl.DateTimeFormat(this.language(), { dateStyle: 'full' }).format(EXAMPLE_EXPIRY),
  );

  protected readonly sameSite = signal<SameSite>('Lax');
  protected readonly sameSiteHint = translateSignal(computed(() => SAME_SITE_HINT[this.sameSite()]));
  /** Chrome rejects SameSite=None without Secure, so Secure is forced on. */
  protected readonly requiresSecure = computed(() => this.sameSite() === 'None');

  /** Prevents the page reload of a native submit; the shell closes the dialog. */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.save.emit();
  }
}
