import type { RefObject } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatInputFormProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	status: ChatStatus;
	isBusy: boolean;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInputForm({
	value,
	onChange,
	onSubmit,
	status,
	isBusy,
	textareaRef,
}: ChatInputFormProps) {
	return (
		<div className="border-t border-border p-3">
			<PromptInput
				globalDrop
				onSubmit={(_, event) => {
					event.preventDefault();
					onSubmit();
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						ref={textareaRef}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Ecrire ici ..."
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-end">
					<PromptInputSubmit
						status={status}
						disabled={!value.trim() || isBusy}
					/>
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}
