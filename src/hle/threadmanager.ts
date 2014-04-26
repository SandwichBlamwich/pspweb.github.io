﻿module hle {
    export class Thread {
        id: number = 0;
        name: string;
		programExecutor: ProgramExecutor;
		initialPriority: number = 10;
        priority: number = 10;
        exitStatus: number = 0;
        running: boolean = false;
		stackPartition: hle.MemoryPartition;
		preemptionCount: number = 0;
		info: WaitingThreadInfo<any> = null;
		waitingName: string = null;
		waitingObject: any = null;
		waitingPromise: Promise<any> = null;

        constructor(public manager: ThreadManager, public state: core.cpu.CpuState, private instructionCache: InstructionCache) {
            this.state.thread = this;
            this.programExecutor = new ProgramExecutor(state, instructionCache);
        }

		suspend() {
			//console.log('suspended ' + this.name);
            this.running = false;
            this.manager.eventOcurred();
		}

		suspendUntileDone(info: WaitingThreadInfo<any>) {
			this.info = info;
			this.waitingName = info.name;
			this.waitingObject = info.object;
			this._suspendUntilPromiseDone(info.promise);
		}

		suspendUntilPromiseDone(promise: Promise<any>, info:core.NativeFunction) {
			this.waitingName = sprintf('%s:0x%08X (Promise)', info.name, info.nid);
			this.waitingObject = info;
			this._suspendUntilPromiseDone(promise);
		}

		_suspendUntilPromiseDone(promise: Promise<any>) {
			this.waitingPromise = promise;

			this.suspend();

			//console.log(promise);

			promise.then((result: number) => {
				this.waitingPromise = null;
				this.waitingName = null;
				this.waitingObject = null;
				if (result !== undefined) this.state.V0 = result;
				
				//console.error('resumed ' + this.name);
                this.resume();
            });
        }

        resume() {
            this.running = true;
            this.manager.eventOcurred();
        }

        start() {
            this.running = true;
			this.manager.threads.add(this);
			this.manager.eventOcurred();
        }

        stop() {
            this.running = false;
			this.manager.threads.delete(this);
			this.manager.eventOcurred();
        }

		runStep() {
			this.preemptionCount++;
			//console.error("Running: " + this.name);
			try {
				this.programExecutor.execute(10000);
				//this.programExecutor.execute(200000);
				//this.programExecutor.execute(2000000);
			} catch (e) {
				this.stop();
				throw (e);
			}
        }
    }

    export class ThreadManager {
        threads: DSet<Thread> = new DSet<Thread>();
        interval: number = -1;
		enqueued: boolean = false;
		running: boolean = false;
		exitPromise: Promise<any>;
		exitResolve: () => void;

		constructor(private memory: core.Memory, private memoryManager: hle.MemoryManager, private display: core.PspDisplay, private syscallManager: core.ISyscallManager, private instructionCache: InstructionCache) {
			this.exitPromise = new Promise((resolve, reject) => {
				this.exitResolve = resolve;
			});
        }

        create(name: string, entryPoint: number, initialPriority: number, stackSize: number = 0x1000) {
			var thread = new Thread(this, new core.cpu.CpuState(this.memory, this.syscallManager), this.instructionCache);
			thread.stackPartition = this.memoryManager.stackPartition.allocateHigh(stackSize);
            thread.name = name;
            thread.state.PC = entryPoint;
            thread.state.RA = CpuSpecialAddresses.EXIT_THREAD;
			thread.state.SP = thread.stackPartition.high;
			thread.initialPriority = initialPriority;
            thread.priority = initialPriority;
            return thread;
        }

		eventOcurred() {
			if (!this.running) return;
            if (this.enqueued) return;
			this.enqueued = true;
			setImmediate(() => this.eventOcurredCallback());
        }

        //get runningThreads() { return this.threads.filter(thread => thread.running); }

        private static getHighestPriority(threads: Thread[]) {
            var priority = -9999;
            threads.forEach(thread => {
                priority = Math.max(priority, thread.priority);
            });
            return priority;
        }

		eventOcurredCallback() {
			if (!this.running) return;

            this.enqueued = false;
            var start = window.performance.now();

            //this.debugThreads();

            //console.log('eventOcurredCallback');

            while (true) {
                /*
                var runningThreads = this.runningThreads;
                if (runningThreads.length == 0) break;

                //var priority = HleThreadManager.getHighestPriority(runningThreads);
                //runningThreads.filter(thread => thread.priority == priority).forEach((thread) => thread.runStep());
                runningThreads.forEach((thread) => thread.runStep());
                */

                var threadCount = 0;
                var priority = 2147483648;

                this.threads.forEach((thread) => {
                    if (thread.running) {
                        threadCount++;
                        priority = Math.min(priority, thread.priority);
                    }
                });

                if (threadCount == 0) break;

                this.threads.forEach((thread) => {
                    if (thread.running) {
                        if (thread.priority == priority) thread.runStep();
                    }
                });

                var current = window.performance.now();
				if (current - start >= 100) {
					setTimeout(() => this.eventOcurred(), 0);
                    return;
				}
            }
        }

        private debugThreads() {
            var html = '';
            this.threads.forEach((thread) => {
                html += sprintf("%08X:%s:%s", thread.state.PC, thread.name, thread.running);
            });
            document.getElementById('thread_list').innerHTML = html;
        }

		startAsync() {
			this.running = true;
			this.eventOcurred();
			return Promise.resolve();
        }

        stopAsync() {
			this.running = false;
			clearInterval(this.interval);
			this.interval = -1;
			return Promise.resolve();
		}

		exitGame() {
			this.exitResolve();
		}

		waitExitGameAsync(): Promise<any> {
			return this.exitPromise;
		}
    }
}
