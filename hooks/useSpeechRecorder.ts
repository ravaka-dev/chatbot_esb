"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
	onend: ((this: SpeechRecognition, ev: Event) => void) | null;
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null;
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
		| null;
}

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	readonly length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
	isFinal: boolean;
}

interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
}

declare global {
	interface Window {
		SpeechRecognition: new () => SpeechRecognition;
		webkitSpeechRecognition: new () => SpeechRecognition;
	}
}

type SpeechInputMode = "speech-recognition" | "media-recorder" | "none";

export interface UseSpeechRecorderOptions {
	onTranscriptionChange?: (text: string) => void;
	/**
	 * Callback for when audio is recorded using MediaRecorder fallback.
	 * This is called in browsers that don't support the Web Speech API (Firefox, Safari).
	 * The callback receives an audio Blob that should be sent to a transcription service.
	 * Return the transcribed text, which will be passed to onTranscriptionChange.
	 */
	onAudioRecorded?: (audioBlob: Blob) => Promise<string>;
	lang?: string;
}

export interface UseSpeechRecorderResult {
	isListening: boolean;
	isProcessing: boolean;
	isDisabled: boolean;
	start: () => void;
	/** Arrête l'enregistrement et transcrit l'audio capté. */
	stop: () => void;
	/** Arrête l'enregistrement et jette l'audio, sans transcription. */
	cancel: () => void;
}

const detectSpeechInputMode = (): SpeechInputMode => {
	if (typeof window === "undefined") {
		return "none";
	}

	// Pourquoi : on ignore volontairement le Web Speech API natif (Chrome/Edge)
	// pour que TOUS les navigateurs passent par MediaRecorder + notre route
	// /api/transcribe (Groq Whisper) — comportement et précision identiques
	// partout, plutôt qu'un résultat différent selon le moteur du navigateur
	if ("MediaRecorder" in window && "mediaDevices" in navigator) {
		return "media-recorder";
	}

	return "none";
};

export function useSpeechRecorder({
	onTranscriptionChange,
	onAudioRecorded,
	lang = "en-US",
}: UseSpeechRecorderOptions = {}): UseSpeechRecorderResult {
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	// Pourquoi : "none" par défaut (identique au rendu SSR, où `window` est
	// absent) puis recalculé côté client dans un effet → évite un mismatch
	// d'hydratation qui laisserait le bouton bloqué en `disabled` pour de bon
	const [mode, setMode] = useState<SpeechInputMode>("none");
	const [isRecognitionReady, setIsRecognitionReady] = useState(false);

	useEffect(() => {
		setMode(detectSpeechInputMode());
	}, []);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	// Pourquoi : distingue un stop() (transcrire) d'un cancel() (jeter l'audio)
	// sans dupliquer la logique de nettoyage du MediaRecorder
	const discardRef = useRef(false);
	const onTranscriptionChangeRef =
		useRef<UseSpeechRecorderOptions["onTranscriptionChange"]>(
			onTranscriptionChange,
		);
	const onAudioRecordedRef =
		useRef<UseSpeechRecorderOptions["onAudioRecorded"]>(onAudioRecorded);

	// Keep refs in sync
	onTranscriptionChangeRef.current = onTranscriptionChange;
	onAudioRecordedRef.current = onAudioRecorded;

	// Initialize Speech Recognition when mode is speech-recognition
	// Pourquoi ce bloc ne s'exécute plus jamais : detectSpeechInputMode ne
	// renvoie plus "speech-recognition" (voir plus haut). On garde le code
	// intact pour pouvoir revenir en arrière facilement si besoin.
	useEffect(() => {
		if (mode !== "speech-recognition") {
			return;
		}

		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		const speechRecognition = new SpeechRecognition();

		speechRecognition.continuous = true;
		speechRecognition.interimResults = true;
		speechRecognition.lang = lang;

		const handleStart = () => {
			setIsListening(true);
		};

		const handleEnd = () => {
			setIsListening(false);
		};

		const handleResult = (event: Event) => {
			const speechEvent = event as SpeechRecognitionEvent;
			let finalTranscript = "";

			for (
				let i = speechEvent.resultIndex;
				i < speechEvent.results.length;
				i += 1
			) {
				const result = speechEvent.results[i];
				if (result.isFinal) {
					finalTranscript += result[0]?.transcript ?? "";
				}
			}

			if (finalTranscript) {
				onTranscriptionChangeRef.current?.(finalTranscript);
			}
		};

		const handleError = () => {
			setIsListening(false);
		};

		speechRecognition.addEventListener("start", handleStart);
		speechRecognition.addEventListener("end", handleEnd);
		speechRecognition.addEventListener("result", handleResult);
		speechRecognition.addEventListener("error", handleError);

		recognitionRef.current = speechRecognition;
		setIsRecognitionReady(true);

		return () => {
			speechRecognition.removeEventListener("start", handleStart);
			speechRecognition.removeEventListener("end", handleEnd);
			speechRecognition.removeEventListener("result", handleResult);
			speechRecognition.removeEventListener("error", handleError);
			speechRecognition.stop();
			recognitionRef.current = null;
			setIsRecognitionReady(false);
		};
	}, [mode, lang]);

	// Cleanup MediaRecorder and stream on unmount
	useEffect(
		() => () => {
			if (mediaRecorderRef.current?.state === "recording") {
				mediaRecorderRef.current.stop();
			}
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) {
					track.stop();
				}
			}
		},
		[],
	);

	// Start MediaRecorder recording
	const startMediaRecorder = useCallback(async () => {
		if (!onAudioRecordedRef.current) {
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const mediaRecorder = new MediaRecorder(stream);
			audioChunksRef.current = [];
			discardRef.current = false;

			const handleDataAvailable = (event: BlobEvent) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			const handleStop = async () => {
				for (const track of stream.getTracks()) {
					track.stop();
				}
				streamRef.current = null;

				if (discardRef.current) {
					return;
				}

				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/webm",
				});

				if (audioBlob.size > 0 && onAudioRecordedRef.current) {
					setIsProcessing(true);
					try {
						const transcript = await onAudioRecordedRef.current(audioBlob);
						if (transcript) {
							onTranscriptionChangeRef.current?.(transcript);
						}
					} catch {
						// Error handling delegated to the onAudioRecorded caller
					} finally {
						setIsProcessing(false);
					}
				}
			};

			const handleError = () => {
				setIsListening(false);
				for (const track of stream.getTracks()) {
					track.stop();
				}
				streamRef.current = null;
			};

			mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
			mediaRecorder.addEventListener("stop", handleStop);
			mediaRecorder.addEventListener("error", handleError);

			mediaRecorderRef.current = mediaRecorder;
			mediaRecorder.start();
			setIsListening(true);
		} catch {
			setIsListening(false);
		}
	}, []);

	// Stop MediaRecorder recording (transcribes what was recorded)
	const stopMediaRecorder = useCallback(() => {
		discardRef.current = false;
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		setIsListening(false);
	}, []);

	// Cancel MediaRecorder recording (discards the audio, no transcription)
	const cancelMediaRecorder = useCallback(() => {
		discardRef.current = true;
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		setIsListening(false);
	}, []);

	const start = useCallback(() => {
		if (mode === "speech-recognition" && recognitionRef.current) {
			recognitionRef.current.start();
		} else if (mode === "media-recorder") {
			startMediaRecorder();
		}
	}, [mode, startMediaRecorder]);

	const stop = useCallback(() => {
		if (mode === "speech-recognition" && recognitionRef.current) {
			recognitionRef.current.stop();
		} else if (mode === "media-recorder") {
			stopMediaRecorder();
		}
	}, [mode, stopMediaRecorder]);

	const cancel = useCallback(() => {
		if (mode === "speech-recognition" && recognitionRef.current) {
			recognitionRef.current.stop();
		} else if (mode === "media-recorder") {
			cancelMediaRecorder();
		}
	}, [mode, cancelMediaRecorder]);

	const isDisabled =
		mode === "none" ||
		(mode === "speech-recognition" && !isRecognitionReady) ||
		(mode === "media-recorder" && !onAudioRecorded) ||
		isProcessing;

	return { cancel, isDisabled, isListening, isProcessing, start, stop };
}
