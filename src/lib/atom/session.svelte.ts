import { Atom, neutralCatalog, type Particle } from './atom.js';
import { kernelCores, nobleGases, rounds, starScores, type Order } from './rounds.js';

import { OrbitalBoard } from './orbital-board.svelte.js';
import { Configuration } from './configuration.js';

type QuantumAnswer = Record<'n' | 'l' | 'ml' | 'ms', string>;
type RoundState = 'ready' | 'running' | 'finished';
type ParticleCounts = Record<Particle, number | null>;
export type OrderSubmission = { kind: 'incorrect' } | { kind: 'correct'; multiplier: number; points: number; goalReached: boolean };

const emptyAtom = new Atom(0, 0, 0);
const initialCounts = { protons: 0, neutrons: 0, electrons: 0 };
const baseOrderPoints = 100;
const streakMultipliers = [
	{ streak: 3, multiplier: 2 },
	{ streak: 6, multiplier: 3 }
] as const;
const particleTrials = rounds.filter(round => !round.manual && !round.quantum).length;
const emptyStars = () => rounds.map(() => 0);
function readStars(values: unknown): number[] {
	return rounds.map((_, index) => {
		const stars = Array.isArray(values) ? values[index] : 0;
		return Number.isSafeInteger(stars) ? Math.max(0, Math.min(stars, starScores.length)) : 0;
	});
}
export class AtomSession {
	#index = $state(0);
	#stars = $state.raw<readonly number[]>(emptyStars());
	#submission = $state.raw<OrderSubmission>();
	#limit = $state(10);
	#showProtons = $state(true);
	#showMass = $state(true);
	#state = $state<RoundState>('ready');
	#orders = $state.raw<readonly Order[]>([]);
	#deck: Atom[] = [];
	#lastDraw?: Atom;
	#atom = $state.raw(emptyAtom);
	#particleCounts = $state<ParticleCounts>({ ...initialCounts });
	#orbitalBoard = $state.raw(new OrbitalBoard());
	#diagramMode = $state<'Möller' | 'Iguano'>('Möller');
	get diagramMode() { return this.#diagramMode; }
	set diagramMode(value: 'Möller' | 'Iguano') { this.#diagramMode = value; }
	get orbitalBoard() { return this.#orbitalBoard; }
	get usesDiagram() { return this.manual && !this.round.kernel; }
	#configuration = $state.raw(new Configuration());
	#history = $state.raw<readonly Configuration[]>([]);
	get configuration() { return this.#configuration; }
	get coreOptions() { return kernelCores.filter(gas => gas.protons <= this.limit); }
	#feedback = $state('');
	#seconds = $state(rounds[0].seconds);
	#delivered = $state(0);
	#lost = $state(0);
	#score = $state(0);
	#streak = $state(0);
	#deadline = 0;
	#nextOrderAt = $state(0);

	get round() { return rounds[this.#index]; }
	get index() { return this.#index; }
	get state() { return this.#state; }
	get running() { return this.#state === 'running'; }
	get seconds() { return this.#seconds; }
	get timeLabel() { return Math.floor(this.#seconds / 60) + ':' + String(this.#seconds % 60).padStart(2, '0'); }
	get delivered() { return this.#delivered; }
	get lost() { return this.#lost; }
	get streak() { return this.#streak; }
	get multiplier() {
		return streakMultipliers.findLast(tier => this.streak >= tier.streak)?.multiplier ?? 1;
	}
	get deliveryPoints() { return baseOrderPoints * this.multiplier; }
	readonly baseOrderPoints = baseOrderPoints;
	readonly streakMultipliers = streakMultipliers;
	readonly starScores = starScores;
	get totalStars() { return this.#stars.reduce((sum, stars) => sum + stars, 0); }
	get roundStars() { return starScores.filter(threshold => this.#score >= threshold).length; }
	get showProtons() { return this.#showProtons; }
	get showMass() { return this.#showMass; }
	set showProtons(value: boolean) { this.#showProtons = value; }
	set showMass(value: boolean) { this.#showMass = value; }
	readonly limitOptions = nobleGases;
	get limit() { return this.#limit; }
	set limit(value: number) {
		if (value === this.#limit || !this.limitOptions.some(gas => gas.protons === value)) return;
		this.#limit = value;
		this.#deck = [];
		if (!this.running) return;
		if (this.#nextOrderAt && this.#orders[0].target.protons > value) this.#openNextOrder();
		const active = this.#orders[0];
		if (this.#orders.every(order => order.target.protons <= value)) return;
		this.#orders = this.#orders.map(order => order.target.protons > value ? this.#order(order.number) : order);
		if (this.#orders[0] !== active) this.#prepareOrder();
	}
	get score() { return this.#score; }
	get submission() { return this.#submission; }
	get orders() { return this.#orders; }
	get atom() { return this.#atom; }
	get particleCounts(): Readonly<ParticleCounts> { return this.#particleCounts; }
	get feedback() { return this.#feedback; }
	get canEdit() { return this.running && this.#nextOrderAt === 0; }
	get usesParticleForm() { return !this.manual && !this.round.quantum; }
	get canUndo() { return this.canEdit && (this.usesDiagram ? this.orbitalBoard.canUndo : this.#history.length > 0); }
	get manual() { return this.round.manual; }
	get unlocked() { return this.#stars[rounds.findIndex(round => round.kernel)] > 0; }
	get snapshot() {
		return { version: 7, stars: [...this.#stars], limit: this.limit, showProtons: this.showProtons, showMass: this.showMass };
	}
	readonly pathLength = particleTrials;
	readonly maxStars = starScores.length;

	get ladder() {
		const earned = this.#stars;
		return rounds.map((round, index) => {
			const stars = earned[index];
			const nextStar = Math.min(stars + 1, this.maxStars);
			return {
				title: round.title, stars, nextStar,
				locked: index > 0 && stars === 0 && earned[index - 1] === 0
			};
		});
	}

	restore(snapshot: unknown, legacySnapshot?: unknown) {
		if (!snapshot || typeof snapshot !== 'object') return;
		this.showProtons = 'showProtons' in snapshot && typeof snapshot.showProtons === 'boolean' ? snapshot.showProtons : true;
		this.showMass = 'showMass' in snapshot && typeof snapshot.showMass === 'boolean' ? snapshot.showMass : true;
		if ('limit' in snapshot && typeof snapshot.limit === 'number') this.limit = snapshot.limit;
		if ('version' in snapshot && snapshot.version === 5 && 'stars' in snapshot &&
			snapshot.stars && typeof snapshot.stars === 'object') {
			const { easy, hard } = snapshot.stars as { easy?: unknown; hard?: unknown };
			const hardStars = readStars(hard);
			this.#stars = readStars(easy).map((stars, i) => Math.max(stars, hardStars[i]));
		} else if ('version' in snapshot && snapshot.version === 4 && 'completed' in snapshot &&
			snapshot.completed && typeof snapshot.completed === 'object') {
			const { easy, hard } = snapshot.completed as { easy?: unknown; hard?: unknown };
			const cleared = (count: unknown) => typeof count === 'number' && Number.isSafeInteger(count) ? count : 0;
			const completed = Math.max(cleared(easy), cleared(hard));
			this.#stars = this.#savedStars(legacySnapshot).map((stars, i) => Math.max(stars, Number(i < completed)));
		} else {
			this.#stars = this.#savedStars(snapshot);
		}
		if (!('version' in snapshot) || snapshot.version !== 7) {
			// Older saves placed electron configuration immediately after ions.
			this.#stars = [...this.#stars.slice(0, 3), 0, ...this.#stars.slice(3, rounds.length - 1)];
		}
		this.#resetRun();
	}

	#savedStars(snapshot: unknown) {
		if (!snapshot || typeof snapshot !== 'object') return emptyStars();
		if ('stars' in snapshot) return readStars(snapshot.stars);
		if ('records' in snapshot && Array.isArray(snapshot.records)) {
			return readStars(snapshot.records.map(count => Number(Number.isSafeInteger(count) && count >= 2)));
		}
		return emptyStars();
	}

	enter(index: number) {
		if (!this.ladder[index] || this.ladder[index].locked || (this.running && index === this.index)) return;
		this.#state = 'ready';
		this.#index = index;
		this.start();
	}

	#resetRun() {
		this.#state = 'ready';
		this.#submission = undefined;
		this.#nextOrderAt = 0;
		this.#orders = [];
		this.#delivered = 0;
		this.#lost = 0;
		this.#score = 0;
		this.#streak = 0;
		this.#seconds = this.round.seconds;
		this.#atom = emptyAtom;
		this.#history = [];
		this.#feedback = '';
	}

	start(now = performance.now()) {
		if (this.running || this.ladder[this.index].locked) return;
		this.#resetRun();
		this.#deck = [];
		this.#lastDraw = undefined;
		this.#orders = [this.#order(1)];
		this.#prepareOrder();
		this.#deadline = now + this.round.seconds * 1000;
		this.#state = 'running';
	}

	tick(now = performance.now()) {
		if (!this.running) return;
		this.#seconds = Math.max(0, Math.ceil((this.#deadline - now) / 1000));
		if (this.#seconds === 0) {
			this.#finish();
		} else if (this.#nextOrderAt && now >= this.#nextOrderAt) {
			this.#openNextOrder();
		}
	}

	#finish() {
		this.#state = 'finished';
		this.#nextOrderAt = 0;
		this.#submission = undefined;
	}

	#openNextOrder() {
		this.#nextOrderAt = 0;
		this.#submission = undefined;
		this.#orders = [...this.#orders.slice(1), this.#order(this.delivered + this.lost + this.#orders.length)];
		this.#prepareOrder();
	}

	#prepareOrder() {
		const { target } = this.#orders[0];
		this.#feedback = '';
		this.#atom = this.manual ? new Atom(target.protons, target.neutrons, 0) : emptyAtom;
		this.#configuration = new Configuration(this.round.kernel && target.protons < kernelCores[0].protons ? null : undefined);
		this.#orbitalBoard = new OrbitalBoard();
		this.#particleCounts = { ...initialCounts };
		this.#quantum = { n: '', l: '', ml: '', ms: '' };
		this.#history = [];
	}

	#quantum = $state({ n: '', l: '', ml: '', ms: '' });
	get quantumAnswer(): Readonly<QuantumAnswer> { return this.#quantum; }
	get quantumElectron() {
		const target = this.orders[0]?.target;
		return target?.quantumElectron(neutralCatalog[target.protons - 2]);
	}

	setQuantumNumber(key: keyof QuantumAnswer, value: string) {
		if (this.round.quantum && this.#canEdit()) this.#quantum[key] = value;
	}

	submitQuantumNumbers() {
		if (!this.round.quantum || !this.#canEdit()) return;
		const electron = this.quantumElectron;
		if (!electron || Object.values(this.#quantum).some(value => !value.trim())) return;
		const correct = (['n', 'l', 'ml', 'ms'] as const).every(key => {
			const value = this.#quantum[key].trim().replace('−', '-').replace(',', '.').replace('½', '1/2');
			const number = key === 'ms' && /^[+-]?1\/2$/.test(value)
				? (value.startsWith('-') ? -0.5 : 0.5)
				: /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ? Number(value) : NaN;
			return number === electron[key];
		});
		return correct ? this.#correctOrder() : this.#incorrectOrder();
	}

	setParticleCount(particle: Particle, count: number | null) {
		if (this.usesParticleForm && this.#canEdit()) this.#particleCounts[particle] = count;
	}

	submitParticleCounts(counts: Readonly<ParticleCounts> = this.#particleCounts): OrderSubmission | undefined {
		if (!this.usesParticleForm || !this.#canEdit()) return;
		let result = this.#atom;
		for (const particle of ['protons', 'neutrons', 'electrons'] as const) {
			const count = counts[particle];
			if (count === null) return this.#incorrectOrder();
			const updated = result.withParticleCount(particle, count);
			if (typeof updated === 'string') return this.#incorrectOrder();
			result = updated;
		}
		this.#atom = result;
		return this.#checkOrder();
	}

	submitConfiguration() {
		if (this.usesDiagram && this.#canEdit()) return this.orbitalBoard.matches(this.orders[0].target) ? this.#correctOrder() : this.#incorrectOrder();
		if (this.round.kernel && this.configuration.complete && this.#canEdit()) return this.#checkOrder();
	}

	toggleSpin(slot: number, spin: 1 | 2) {
		if (this.usesDiagram && this.#canEdit()) this.orbitalBoard.toggle(slot, spin);
	}

	choosePart(value: string) {
		if (this.round.kernel && this.#canEdit()) this.#edit(this.configuration.choose(value));
	}

	selectCore(protons: number) {
		if (!this.round.kernel || !this.#canEdit() || this.configuration.core !== undefined) return;
		if (!this.coreOptions.some(gas => gas.protons === protons)) return;
		this.#edit(new Configuration(neutralCatalog.find(atom => atom.protons === protons) ?? null));
	}

	#edit(configuration: Configuration) {
		if (configuration === this.configuration) return;
		this.#history = [...this.#history, this.configuration];
		this.#configuration = configuration;
		this.#feedback = '';
	}

	undo() {
		if (!this.#canEdit() || !this.canUndo) return;
		if (this.usesDiagram) this.orbitalBoard.undo();
		else {
			this.#configuration = this.#history.at(-1)!;
			this.#history = this.#history.slice(0, -1);
		}
		this.#feedback = 'Movimiento deshecho.';
	}

	#order(number: number): Order {
		if (!this.#deck.length) {
			this.#deck = this.round.recipes.filter(recipe => recipe.protons <= this.limit);
			for (let i = this.#deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.#deck[i], this.#deck[j]] = [this.#deck[j], this.#deck[i]];
			}
			const last = this.#deck.length - 1;
			if (last > 0 && this.#deck[last] === this.#lastDraw) {
				const swap = Math.floor(Math.random() * last);
				[this.#deck[last], this.#deck[swap]] = [this.#deck[swap], this.#deck[last]];
			}
		}
		const target = this.#deck.pop()!;
		this.#lastDraw = target;
		return { target, number };
	}


	#canEdit() {
		if (!this.canEdit) return false;
		this.tick();
		return this.canEdit;
	}

	#incorrectOrder(): OrderSubmission {
		this.#lost++;
		this.#streak = 0;
		this.#nextOrderAt = performance.now() + 700;
		return this.#submission = { kind: 'incorrect' };
	}

	#checkOrder(): OrderSubmission {
		const atom = this.#atom;
		const { target } = this.#orders[0];
		const correct = this.manual
			? this.configuration.matches(target) && this.configuration.core?.protons === kernelCores.findLast(gas => gas.protons <= target.protons)?.protons
			: atom.protons === target.protons && atom.neutrons === target.neutrons && atom.electrons === target.electrons;
		if (!correct) {
			return this.#incorrectOrder();
		}

		return this.#correctOrder();
	}

	#correctOrder(): OrderSubmission {
		const previousStars = this.roundStars;
		this.#delivered++;
		this.#streak++;
		const points = this.deliveryPoints;
		this.#score += points;
		const stars = this.roundStars;
		if (stars > this.#stars[this.index]) {
			const earned = [...this.#stars];
			earned[this.index] = stars;
			this.#stars = earned;
		}
		this.#nextOrderAt = performance.now() + 550;
		return this.#submission = { kind: 'correct', points, multiplier: this.multiplier, goalReached: stars > previousStars };
	}
}
