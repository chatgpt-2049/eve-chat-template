"use client";

import { LockKeyholeIcon } from "lucide-react";
import { PasswordSignInForm } from "@/components/auth/password-sign-in-form";
import { SignInButton } from "@/components/auth/sign-in-button";
import { VercelIcon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthMode } from "@/lib/chat/types";

export function SignInModal({
  authMode,
  callbackPath,
  disabled,
  onBeforeSignIn,
  onOpenChange,
  open,
}: {
  readonly authMode: AuthMode;
  readonly callbackPath?: string;
  readonly disabled?: boolean;
  readonly onBeforeSignIn?: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
}) {
  const usesPassword = authMode === "password";
  const usesVercel = authMode === "vercel";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            {usesPassword ? (
              <LockKeyholeIcon className="size-4 text-foreground" />
            ) : (
              <VercelIcon className="size-4 text-foreground" />
            )}
          </div>
          <DialogTitle>
            {usesPassword
              ? "Enter chat password"
              : usesVercel
                ? "Sign up or in to get started"
                : "Chat setup required"}
          </DialogTitle>
          <DialogDescription>
            {usesPassword
              ? "Use the password configured by the person who deployed this agent."
              : usesVercel
                ? "Connect your Vercel account to send messages and save sessions."
                : "Configure EVE_CHAT_PASSWORD in your project environment variables, then redeploy to enable password sign-in."}
          </DialogDescription>
        </DialogHeader>
        {usesPassword ? (
          <PasswordSignInForm callbackPath={callbackPath} onBeforeSignIn={onBeforeSignIn} />
        ) : usesVercel ? (
          <SignInButton
            callbackPath={callbackPath}
            className="h-11 w-full"
            disabled={disabled}
            onBeforeSignIn={onBeforeSignIn}
            variant="outline"
          >
            Continue with Vercel
          </SignInButton>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
