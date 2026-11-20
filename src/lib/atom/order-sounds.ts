import type { OrderSubmission } from './session.svelte.js';

const correctNotes = [523.25, 659.25, 783.99, 1046.5];
const goalNotes = [587.33, 739.99, 880, 1174.66];
const incorrectNotes = [293.66, 220];

export class OrderSounds {
	#context?: AudioContext;
	#output?: GainNode;
	#enabled = true;

	set enabled(value: boolean) {
		this.#enabled = value;
		if (this.#output) this.#output.gain.value = Number(value);
	}

	async play(result: OrderSubmission) {
		if (!this.#enabled || typeof AudioContext === 'undefined') return;
		try {
			const context = this.#context ??= new AudioContext();
			if (!this.#output) {
				this.#output = context.createGain();
				this.#output.connect(context.destination);
			}
			if (context.state !== 'running') await context.resume();
			if (!this.#enabled || this.#context !== context) return;

			const notes = result.kind === 'incorrect' ? incorrectNotes
				: result.goalReached ? goalNotes : correctNotes.slice(0, result.multiplier + 1);
			const type = result.kind === 'incorrect' ? 'sine' : 'triangle';
			const interval = result.kind === 'correct' && result.goalReached ? 0.095 : 0.065;
			const startTime = context.currentTime;
			for (const [index, frequency] of notes.entries()) {
				const start = startTime + index * interval;
				const oscillator = context.createOscillator();
				const envelope = context.createGain();
				oscillator.type = type;
				oscillator.frequency.value = frequency;
				envelope.gain.setValueAtTime(0.001, start);
				envelope.gain.linearRampToValueAtTime(0.045, start + 0.012);
				envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
				oscillator.connect(envelope).connect(this.#output);
				oscillator.start(start);
				oscillator.stop(start + 0.14);
				oscillator.onended = () => envelope.disconnect();
			}
		} catch {
			// The game remains playable if the browser cannot start audio.
		}
	}

	dispose() {
		const context = this.#context;
		this.#context = undefined;
		this.#output = undefined;
		void context?.close().catch(() => {});
	}
}
