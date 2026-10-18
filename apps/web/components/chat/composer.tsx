"use client";

import { ArrowUpIcon, Loader2Icon, SquareIcon, PaperclipIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChatMessageLength, MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat/limits";
import { cn } from "@/lib/utils";

export function ChatComposer({
  autoFocus = true,
  className,
  disabled = false,
  disabledReason,
  footerStart,
  isBusy = false,
  isPreparing = false,
  maxLength = MAX_CHAT_MESSAGE_CHARS,
  onChange,
  onSubmit,
  placeholder = "Ask eve anything...",
  value,
}: {
  readonly autoFocus?: boolean;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly footerStart?: ReactNode;
  readonly isBusy?: boolean;
  readonly isPreparing?: boolean;
  readonly maxLength?: number;
  readonly onChange: (value: string) => void;
  readonly onStop: () => void;
  readonly onSubmit: (value: string) => void | Promise<void>;
  readonly placeholder?: string;
  readonly value: string;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaDisabled = disabled || isBusy || isPreparing || isImporting;
  const trimmedValue = value.trim();
  const isOverMaxLength = getChatMessageLength(trimmedValue) > maxLength;

  useEffect(() => {
    if (!autoFocus || textareaDisabled) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, textareaDisabled]);

  const submitValue = useCallback(() => {
    const text = value.trim();
    if (!text || disabled || isBusy || isPreparing || isImporting || getChatMessageLength(text) > maxLength) {
      return;
    }

    void onSubmit(text);
  }, [disabled, isBusy, isPreparing, isImporting, maxLength, onSubmit, value]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitValue();
    },
    [submitValue],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitValue();
      }
    },
    [submitValue],
  );

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    setImportError(null);
    setIsImporting(true);
    try {
      const selected = Array.from(files);
      if (selected.length > 10 || selected.reduce((sum, f) => sum + f.size, 0) > 256 * 1024) {
        throw new Error("Select up to 10 text files, totaling at most 256 KB.");
      }
      const parts: string[] = [];
      for (const file of selected) {
        if (!/\.(txt|md|mdx|csv|json|js|jsx|ts|tsx|py|html|css|xml|yaml|yml|sql|sh|go|rs|java|c|cpp|h|log)$/i.test(file.name)) {
          throw new Error("Only code and text files are supported here. PDF and images are not supported yet.");
        }
        const content = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
        if (content.includes("\0")) throw new Error("Binary files cannot be imported as text.");
        parts.push(`File: ${file.name}\n${content}\nEnd file: ${file.name}`);
      }
      const next = [value, ...parts].filter(Boolean).join("\n\n");
      if (getChatMessageLength(next) > maxLength) {
        throw new Error(`Imported content exceeds the ${maxLength}-character message limit. Select smaller files.`);
      }
      onChange(next);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to read files. Try UTF-8 text files.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const form = (
    <form
      className={cn(
        "min-w-0 rounded-[14px] border border-border/80 bg-card/95 shadow-sm transition-colors focus-within:border-border focus-within:ring-[1px] focus-within:ring-foreground/5 dark:bg-muted/45 dark:focus-within:ring-white/5",
        className,
      )}
      data-chat-composer
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={composerId}>
        Message eve
      </label>
      <textarea
        autoFocus={autoFocus}
        className="max-h-32 min-h-12 w-full resize-none bg-transparent px-3 pt-3 pb-1 text-base leading-6 outline-none placeholder:text-muted-foreground/45 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 md:text-[15px] dark:placeholder:text-muted-foreground/60"
        data-chat-composer-input
        disabled={textareaDisabled}
        id={composerId}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={2}
        value={value}
      />
      {importError ? <p role="alert" className="px-3 text-sm text-destructive">{importError}</p> : null}
      {isImporting ? <p role="status" className="px-3 text-sm">Reading files…</p> : null}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.mdx,.csv,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.xml,.yaml,.yml,.sql,.sh,.go,.rs,.java,.c,.cpp,.h,.log"
        className="hidden"
        aria-label="Choose code or text files"
        onChange={(event) => void importFiles(event.target.files)}
      />
      <div className="flex min-h-9 items-center justify-between gap-2 px-3 pt-1 pb-2 sm:gap-3 sm:px-4">
        <div className="-ml-2 flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Import code or text files"
            title="Import code or text files"
            disabled={textareaDisabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon className="size-4" />
          </Button>
          {footerStart ?? <span className="block h-8" />}
        </div>
        <div className="flex shrink-0 items-center">
          {isBusy ? (
            <Button
              aria-label="Response in progress"
              className="size-6 cursor-default rounded-md bg-foreground/15 text-foreground/55 shadow-none hover:bg-foreground/15 disabled:cursor-default disabled:pointer-events-auto disabled:opacity-100"
              disabled
              size="icon-xs"
              type="button"
            >
              <SquareIcon className="size-2.5 fill-current" />
            </Button>
          ) : isPreparing ? (
            <Button
              aria-label="Preparing chat"
              className="size-6 rounded-md bg-foreground/75 text-background"
              disabled
              size="icon-xs"
              type="button"
            >
              <Loader2Icon className="size-3 animate-spin" />
            </Button>
          ) : (
            <Button
              aria-label="Send message"
              className="size-6 cursor-pointer rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-30"
              disabled={textareaDisabled || trimmedValue.length === 0 || isOverMaxLength}
              size="icon-xs"
              type="submit"
            >
              <ArrowUpIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );

  if (!disabledReason || (!disabled && !isBusy && !isPreparing)) {
    return form;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div aria-label={disabledReason} className="min-w-0" tabIndex={0}>
          {form}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{disabledReason}</TooltipContent>
    </Tooltip>
  );
}
