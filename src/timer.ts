
import * as Util from './util';

export class Timer {
	private going: boolean;
	private time: number;
	private interval: number;
	private onInterval: (secondsLeft: number) => void;
	private onEnd: () => void;

	/**
	 * pass in no parameters to make a dummy timer
	 * 
	 * @param time 
	 * @param interval 
	 * @param onInterval 
	 * @param onEnd 
	 */
	constructor(time?: number, interval?: number, onInterval?: (secondsLeft: number) => void, onEnd?: () => void) {
		this.time = time || 0;
		this.interval = interval || 0;
		this.onInterval = onInterval || (s => {});
		this.onEnd = onEnd || (() => {});

		this.going = false;
	}

	setTime(seconds: number) {
		this.time = seconds;
	}

	getTime() {
		return this.time;
	}

	start() {
		this.going = true;

		let secondsLeft = this.time;

		/* async block that runs the timer */
		(async () => {
			while (this.going && secondsLeft > 0) {
				await Util.sleep(1000);
				--secondsLeft;
	
				if (this.going && secondsLeft == 0) {
					this.going = false;

					this.onInterval(secondsLeft);
					this.onEnd();

				} else if (this.going && secondsLeft % this.interval == 0) {
					this.onInterval(secondsLeft);
				}
			}
		})();
	}

	stop() {
		this.going = false;
	}
}
