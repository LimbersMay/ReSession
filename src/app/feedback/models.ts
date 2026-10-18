/** A question the user must answer before an operation goes on. Text arrives already translated. */
export interface ConfirmRequest {
  /** The question, naming the object: "Delete user_session?" */
  title: string;
  /** A full sentence shown in bold before the message. Optional. */
  lead: string | undefined;
  /** The consequence of confirming. */
  message: string;
  /** Text of the confirm button; repeats the verb ("Delete"), never "Accept". */
  verb: string;
  /** Red confirm button when the operation deletes something; brand colour otherwise. */
  isDestructive: boolean;
}

/** A notice about what just happened. Text arrives already translated. */
export interface ToastMessage {
  /** Grows with every toast so each message renders as a new element (restarts the timer bar). */
  id: number;
  text: string;
  /** How long it stays visible, in milliseconds. */
  duration: number;
  /** When present, the toast shows an "Undo" button that runs it. */
  undo: (() => void) | undefined;
}
