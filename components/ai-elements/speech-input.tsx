"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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

// Pourquoi : nombre de barres du waveform généré ici, doit correspondre
// au nombre de barres consommées par WaveformBars côté parent
const AUDIO_LEVEL_BARS = 20;

export type SpeechInputProps = ComponentProps<typeof Button> & {
	onTranscriptionChange?: (text: string) => void;
	/**
	 * Callback for when audio is recorded using MediaRecorder fallback.
	 * This is called in browsers that don't support the Web Speech API (Firefox, Safari).
	 * The callback receives an audio Blob that should be sent to a transcription service.
	 * Return the transcribed text, which will be passed to onTranscriptionChange.
	 */
	onAudioRecorded?: (audioBlob: Blob) => Promise<string>;
	/**
	 * Appelé à chaque changement d'état d'enregistrement (démarrage/arrêt).
	 * Permet au parent d'afficher un waveform à la place de l'input pendant l'enregistrement.
	 */
	onListeningChange?: (isListening: boolean) => void;
	/**
	 * Appelé en continu pendant l'enregistrement avec les niveaux de volume
	 * (tableau de valeurs entre 0 et 1), pour piloter un visualiseur audio.
	 */
	onAudioLevelChange?: (levels: number[]) => void;
	lang?: string;
};

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

export const SpeechInput = ({
	className,
	onTranscriptionChange,
	onAudioRecorded,
	onListeningChange,
	onAudioLevelChange,
	lang = "en-US",
	...props
}: SpeechInputProps) => {
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [mode] = useState<SpeechInputMode>(detectSpeechInputMode);
	const [isRecognitionReady, setIsRecognitionReady] = useState(false);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserFrameRef = useRef<number>(0);
	const onTranscriptionChangeRef = useRef
		<SpeechInputProps["onTranscriptionChange"]
	>(onTranscriptionChange);
	const onAudioRecordedRef =
		useRef<SpeechInputProps["onAudioRecorded"]>(onAudioRecorded);
	const onListeningChangeRef =
		useRef<SpeechInputProps["onListeningChange"]>(onListeningChange);
	const onAudioLevelChangeRef =
		useRef<SpeechInputProps["onAudioLevelChange"]>(onAudioLevelChange);

	// Keep refs in sync
	onTranscriptionChangeRef.current = onTranscriptionChange;
	onAudioRecordedRef.current = onAudioRecorded;
	onListeningChangeRef.current = onListeningChange;
	onAudioLevelChangeRef.current = onAudioLevelChange;

	// Pourquoi : boucle de lecture du volume, indépendante du MediaRecorder —
	// elle tourne tant que le stream est actif et alimente onAudioLevelChange
	const startAudioAnalysis = useCallback((stream: MediaStream) => {
		const audioCtx = new AudioContext();
		const source = audioCtx.createMediaStreamSource(stream);
		const analyser = audioCtx.createAnalyser();
		analyser.fftSize = 64;
		source.connect(analyser);
		audioContextRef.current = audioCtx;

		const data = new Uint8Array(analyser.frequencyBinCount);
		const step = Math.max(1, Math.floor(data.length / AUDIO_LEVEL_BARS));

		const tick = () => {
			analyser.getByteFrequencyData(data);
			const levels = Array.from({ length: AUDIO_LEVEL_BARS }, (_, i) => {
				const slice = data.slice(i * step, (i + 1) * step);
				if (slice.length === 0) return 0;
				return slice.reduce((a, b) => a + b, 0) / slice.length / 255;
			});
			onAudioLevelChangeRef.current?.(levels);
			analyserFrameRef.current = requestAnimationFrame(tick);
		};
		tick();
	}, []);

	// Pourquoi le guard `state !== "closed"` : évite une InvalidStateError
	// si stopAudioAnalysis est appelé deux fois (ex: cleanup au démontage
	// PUIS l'event "stop" du MediaRecorder qui arrive juste après)
	const stopAudioAnalysis = useCallback(() => {
		cancelAnimationFrame(analyserFrameRef.current);
		if (audioContextRef.current && audioContextRef.current.state !== "closed") {
			audioContextRef.current.close();
		}
		audioContextRef.current = null;
		onAudioLevelChangeRef.current?.(new Array(AUDIO_LEVEL_BARS).fill(0));
	}, []);

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
			onListeningChangeRef.current?.(true);
		};

		const handleEnd = () => {
			setIsListening(false);
			onListeningChangeRef.current?.(false);
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
			onListeningChangeRef.current?.(false);
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

	// Cleanup MediaRecorder, stream et analyse audio au démontage
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
			stopAudioAnalysis();
		},
		[stopAudioAnalysis],
	);

	// Start MediaRecorder recording
	const startMediaRecorder = useCallback(async () => {
		if (!onAudioRecordedRef.current) {
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			startAudioAnalysis(stream);

			const mediaRecorder = new MediaRecorder(stream);
			audioChunksRef.current = [];

			const handleDataAvailable = (event: BlobEvent) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			const handleStop = async () => {
				stopAudioAnalysis();
				for (const track of stream.getTracks()) {
					track.stop();
				}
				streamRef.current = null;

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
				stopAudioAnalysis();
				setIsListening(false);
				onListeningChangeRef.current?.(false);
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
			onListeningChangeRef.current?.(true);
		} catch {
			setIsListening(false);
		}
	}, [startAudioAnalysis, stopAudioAnalysis]);

	// Stop MediaRecorder recording
	const stopMediaRecorder = useCallback(() => {
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		setIsListening(false);
		onListeningChangeRef.current?.(false);
	}, []);

	const toggleListening = useCallback(() => {
		if (mode === "speech-recognition" && recognitionRef.current) {
			if (isListening) {
				recognitionRef.current.stop();
			} else {
				recognitionRef.current.start();
			}
		} else if (mode === "media-recorder") {
			if (isListening) {
				stopMediaRecorder();
			} else {
				startMediaRecorder();
			}
		}
	}, [mode, isListening, startMediaRecorder, stopMediaRecorder]);

	// Determine if button should be disabled
	const isDisabled =
		mode === "none" ||
		(mode === "speech-recognition" && !isRecognitionReady) ||
		(mode === "media-recorder" && !onAudioRecorded) ||
		isProcessing;

	return (
		<div className="relative inline-flex items-center justify-center">
			{/* Animated pulse rings */}
			{isListening &&
				[0, 1, 2].map((index) => (
					<div
						className="absolute inset-0 animate-ping rounded-full border-2 border-red-400/30"
						key={index}
						style={{
							animationDelay: `${index * 0.3}s`,
							animationDuration: "2s",
						}}
					/>
				))}

			{/* Main record button */}
			<Button
				type="button"
				className={cn(
					"relative z-10 rounded-full transition-all duration-300",
					isListening
						? "bg-destructive text-white hover:bg-destructive/80 hover:text-white"
						: "bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
					className,
				)}
				disabled={isDisabled}
				onClick={toggleListening}
				{...props}
			>
				{isProcessing && <Spinner />}
				{!isProcessing && isListening && <SquareIcon className="size-4" />}
				{!(isProcessing || isListening) && <MicIcon className="size-4" />}
			</Button>
		</div>
	);
};