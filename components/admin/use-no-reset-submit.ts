"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a `useActionState` action without letting React clear it.
 *
 * Passing the action straight to `<form action={...}>` makes React 19 reset the
 * form once the action settles — including when it comes back with a validation
 * error. Every uncontrolled field (anything on `defaultValue`) snaps back to its
 * default, so a half-finished product had to be retyped from scratch just
 * because the English name was missing.
 *
 * Building the FormData by hand and dispatching it inside a transition keeps the
 * pending state and the action result intact, minus the reset. The submitter is
 * passed to FormData so the clicked button's `name`/`value` — how the draft vs
 * publish intent is carried — still lands in the payload.
 */
export function useNoResetSubmit(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(
      event.currentTarget,
      submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter : undefined,
    );
    startTransition(() => action(formData));
  };
}
