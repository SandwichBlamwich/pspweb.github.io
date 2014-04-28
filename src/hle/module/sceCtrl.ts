﻿import _utils = require('../utils');
import _context = require('../../context');
import _controller = require('../../core/controller');
import _cpu = require('../../core/cpu');
import createNativeFunction = _utils.createNativeFunction;

export class sceCtrl {
	constructor(private context: _context.EmulatorContext) { }

    sceCtrlPeekBufferPositive = createNativeFunction(0x3A622550, 150, 'uint', 'void*/int', this, (sceCtrlDataPtr: Stream, count: number) => {
		_controller.SceCtrlData.struct.write(sceCtrlDataPtr, this.context.controller.data);
        return 0;
    });

	sceCtrlReadBufferPositive = createNativeFunction(0x1F803938, 150, 'uint', 'CpuState/void*/int', this, (state: _cpu.CpuState, sceCtrlDataPtr: Stream, count: number) => {
		_controller.SceCtrlData.struct.write(sceCtrlDataPtr, this.context.controller.data);

		return new WaitingThreadInfo('sceCtrlReadBufferPositive', this.context.display, this.context.display.waitVblankStartAsync());
		//return 0;
    });

    sceCtrlSetSamplingCycle = createNativeFunction(0x6A2774F3, 150, 'uint', 'int', this, (samplingCycle: number) => {
        //console.warn('Not implemented sceCtrl.sceCtrlSetSamplingCycle');
        return 0;
    });

    sceCtrlSetSamplingMode = createNativeFunction(0x1F4011E6, 150, 'uint', 'int', this, (samplingMode: number) => {
        //console.warn('Not implemented sceCtrl.sceCtrlSetSamplingMode');
        return 0;
	});

	sceCtrlReadLatch = createNativeFunction(0x0B588501, 150, 'uint', 'void*', this, (currentLatchPtr: Stream) => {
		console.warn('Not implemented sceCtrl.sceCtrlReadLatch');
		return 0;
	});
}