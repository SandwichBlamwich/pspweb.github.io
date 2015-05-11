﻿///<reference path="../../global.d.ts" />

import _utils = require('../utils');
import SceKernelErrors = require('../SceKernelErrors');
import _context = require('../../context');
import _riff = require('../../format/riff'); _riff.Riff;
import Riff = _riff.Riff;
import nativeFunction = _utils.nativeFunction;

export class sceAtrac3plus {
	constructor(private context: _context.EmulatorContext) { }

	private _atrac3Ids = new UidCollection<Atrac3>();

	@nativeFunction(0x7A20E7AF, 150, 'uint', 'byte[]')
	sceAtracSetDataAndGetID(data: Stream) {
		return Atrac3.fromStreamAsync(data).then(at3 => {
			return this._atrac3Ids.allocate(at3);
		});
	}

	@nativeFunction(0x0E2A73AB, 150, 'uint', 'int/byte[]')
	sceAtracSetData(id:number, data: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		atrac3.setDataStream(data);
		return 0;
	}

	@nativeFunction(0x83E85EA0, 150, 'uint', 'int/void*/void*')
	sceAtracGetSecondBufferInfo(id: number, puiPosition: Stream, puiDataByte: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		puiPosition.writeInt32(0);
		puiDataByte.writeInt32(0);
		return SceKernelErrors.ERROR_ATRAC_SECOND_BUFFER_NOT_NEEDED;
	}

	@nativeFunction(0x83BF7AFD, 150, 'uint', 'int/void*/uint')
	sceAtracSetSecondBuffer(id: number, pucSecondBufferAddr: Stream, uiSecondBufferByte: number) {
		//throw (new Error("Not implemented sceAtracSetSecondBuffer"));
		return 0;
	}

	@nativeFunction(0x61EB33F5, 150, 'uint', 'int')
	sceAtracReleaseAtracID(id: number) {
		var atrac3 = this.getById(id);
		atrac3.free();
		this._atrac3Ids.remove(id);
		return 0;
	}

	@nativeFunction(0x6A8C3CD5, 150, 'uint', 'int/void*/void*/void*/void*')
	sceAtracDecodeData(id: number, samplesOutPtr: Stream, decodedSamplesCountPtr: Stream, reachedEndPtr: Stream, remainingFramesToDecodePtr: Stream) {
		if (!this.hasById(id)) return Promise2.resolve(SceKernelErrors.ATRAC_ERROR_NO_ATRACID);
		var atrac3 = this.getById(id);

		return atrac3.decodeAsync(samplesOutPtr).then((decodedSamples) => {
			var reachedEnd = 0;
			var remainingFramesToDecode = atrac3.remainingFrames;

			function outputPointers() {
				if (reachedEndPtr) reachedEndPtr.writeInt32(reachedEnd);
				if (decodedSamplesCountPtr) decodedSamplesCountPtr.writeInt32(decodedSamples / atrac3.format.atracChannels);
				if (remainingFramesToDecodePtr) remainingFramesToDecodePtr.writeInt32(remainingFramesToDecode);
			}

			//Console.WriteLine("{0}/{1} -> {2} : {3}", Atrac.DecodingOffsetInSamples, Atrac.TotalSamples, DecodedSamples, Atrac.DecodingReachedEnd);

			if (atrac3.decodingReachedEnd) {
				if (atrac3.numberOfLoops == 0) {
				//if (true) {
					decodedSamples = 0;
					reachedEnd = 1;
					remainingFramesToDecode = 0;
					outputPointers();
					return SceKernelErrors.ERROR_ATRAC_ALL_DATA_DECODED;
				}
				if (atrac3.numberOfLoops > 0) atrac3.numberOfLoops--;

				atrac3.currentSample = (atrac3.loopInfoList.length > 0) ? atrac3.loopInfoList[0].startSample : 0;
			}

			//return Atrac.GetUidIndex(InjectContext);
			outputPointers();
			return 0;
		});
	}

	/**
	 * Gets the remaining (not decoded) number of frames
	 * Pointer to a integer that receives either -1 if all at3 data is already on memory, 
	 * or the remaining (not decoded yet) frames at memory if not all at3 data is on memory 
	 * @return Less than 0 on error, otherwise 0
	 */
	@nativeFunction(0x9AE849A7, 150, 'uint', 'int/void*')
	sceAtracGetRemainFrame(id: number, remainFramePtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		if (remainFramePtr) remainFramePtr.writeInt32(atrac3.remainingFrames);
		return 0;
	}

	@nativeFunction(0xA554A158, 150, 'uint', 'int/void*')
	sceAtracGetBitrate(id: number, bitratePtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		bitratePtr.writeInt32(atrac3.bitrate);
		return 0;
	}

	@nativeFunction(0x31668baa, 150, 'uint', 'int/void*')
	sceAtracGetChannel(id: number, channelsPtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		channelsPtr.writeInt32(atrac3.format.atracChannels);
		return 0;
	}

	@nativeFunction(0xD6A5F2F7, 150, 'uint', 'int/void*')
	sceAtracGetMaxSample(id: number, maxNumberOfSamplesPtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		maxNumberOfSamplesPtr.writeInt32(atrac3.maximumSamples);
		return 0;
	}

	@nativeFunction(0x36FAABFB, 150, 'uint', 'int/void*')
	sceAtracGetNextSample(id: number, numberOfSamplesInNextFramePtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);

		numberOfSamplesInNextFramePtr.writeInt32(atrac3.getNumberOfSamplesInNextFrame());
		return 0;
	}

	@nativeFunction(0x780F88D1, 150, 'uint', 'int')
	sceAtracGetAtracID(codecType: CodecType) {
		if (codecType != CodecType.PSP_MODE_AT_3 && codecType != CodecType.PSP_MODE_AT_3_PLUS) {
			return SceKernelErrors.ATRAC_ERROR_INVALID_CODECTYPE;
		}

		return this._atrac3Ids.allocate(new Atrac3(-1));
	}
	
	private hasById(id: number) { return this._atrac3Ids.has(id); }

	private getById(id: number):Atrac3 {
		return this._atrac3Ids.get(id);
	}

	@nativeFunction(0x7DB31251, 150, 'uint', 'int/int')
	sceAtracAddStreamData(id: number, bytesToAdd: number) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		//console.warn("Not implemented sceAtracAddStreamData", id, bytesToAdd, atrac3);
		//throw (new Error("Not implemented sceAtracAddStreamData"));
		//return -1;
		return 0;
	}

	@nativeFunction(0x5D268707, 150, 'uint', 'int/void*/void*/void*')
	sceAtracGetStreamDataInfo(id: number, writePointerPointer: Stream, availableBytesPtr: Stream, readOffsetPtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		writePointerPointer.writeInt32(0);
		availableBytesPtr.writeInt32(0);
		readOffsetPtr.writeInt32(0);
		//WritePointerPointer = Atrac.PrimaryBuffer.Low; // @FIXME!!
		//AvailableBytes = Atrac.PrimaryBuffer.Size;
		//ReadOffset = Atrac.PrimaryBufferReaded;

		//console.warn("Not implemented sceAtracGetStreamDataInfo");
		//throw (new Error("Not implemented sceAtracGetStreamDataInfo"));
		//return -1;
		return 0;
	}

	@nativeFunction(0xE23E3A35, 150, 'uint', 'int/void*')
	sceAtracGetNextDecodePosition(id: number, samplePositionPtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		if (atrac3.decodingReachedEnd) return SceKernelErrors.ERROR_ATRAC_ALL_DATA_DECODED;
		if (samplePositionPtr) samplePositionPtr.writeInt32(atrac3.currentSample);
		return 0;
	}

	@nativeFunction(0xA2BBA8BE, 150, 'uint', 'int/void*/void*/void*')
	sceAtracGetSoundSample(id: number, endSamplePtr: Stream, loopStartSamplePtr: Stream, loopEndSamplePtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		var hasLoops = (atrac3.loopInfoList != null) && (atrac3.loopInfoList.length > 0);
		if (endSamplePtr) endSamplePtr.writeInt32(atrac3.fact.endSample)
		//if (loopStartSamplePtr) loopStartSamplePtr.writeInt32(hasLoops ? atrac3.LoopInfoList[0].StartSample : -1);
		if (loopStartSamplePtr) loopStartSamplePtr.writeInt32(-1);
		//if (loopEndSamplePtr) *LoopEndSamplePointer = hasLoops ? atrac3.LoopInfoList[0].EndSample : -1;
		if (loopEndSamplePtr) loopEndSamplePtr.writeInt32(-1);
		return 0;
	}

	@nativeFunction(0x868120B5, 150, 'uint', 'int/int')
	sceAtracSetLoopNum(id: number, numberOfLoops: number) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		atrac3.numberOfLoops = numberOfLoops;
		return 0;
	}

	@nativeFunction(0xCA3CA3D2, 150, 'uint', 'int/uint/void*')
	sceAtracGetBufferInfoForReseting(id: number, uiSample: number, bufferInfoPtr: Stream) {
		throw (new Error("Not implemented sceAtracGetBufferInfoForReseting"));
		return 0;
	}

	@nativeFunction(0x644E5607, 150, 'uint', 'int/uint/uint/uint')
	sceAtracResetPlayPosition(id: number, uiSample: number, uiWriteByteFirstBuf: number, uiWriteByteSecondBuf: number) {
		throw (new Error("Not implemented sceAtracResetPlayPosition"));
		return 0;
	}

	@nativeFunction(0xE88F759B, 150, 'uint', 'int/void*')
	sceAtracGetInternalErrorInfo(id: number, errorResultPtr: Stream) {
		throw (new Error("Not implemented sceAtracGetInternalErrorInfo"));
		return 0;
	}

	@nativeFunction(0xB3B5D042, 150, 'uint', 'int/void*')
	sceAtracGetOutputChannel(id: number, outputChannelPtr: Stream) {
		if (!this.hasById(id)) return SceKernelErrors.ATRAC_ERROR_NO_ATRACID;
		var atrac3 = this.getById(id);
		var sceAudioChReserve = this.context.moduleManager.getByName('sceAudio').getByName('sceAudioChReserve').nativeCall;
		var channel = sceAudioChReserve(-1, atrac3.maximumSamples, 0);
		outputChannelPtr.writeInt32(channel);
		return 0;
	}
}

class Atrac3 {
	format = new At3FormatStruct();
	fact = new FactStruct();
	smpl = new SmplStruct();
	loopInfoList = <LoopInfoStruct[]>[];
	dataStream = Stream.fromArray([]);
	numberOfLoops = 0;
	currentSample = 0;
	codecType = CodecType.PSP_MODE_AT_3_PLUS;
	private stream: MediaEngine.MeStream;

	constructor(private id:number) {
	}
	
	free() {
		this.stream.close();
	}

	setDataStream(data: Stream) {
		var dataBytes = data.clone().readAllBytes();		
		
		Riff.fromStreamWithHandlers(data, {
			'fmt ': (stream: Stream) => { this.format = At3FormatStruct.struct.read(stream); },
			'fact': (stream: Stream) => { this.fact = FactStruct.struct.read(stream); },
			'smpl': (stream: Stream) => {
				this.smpl = SmplStruct.struct.read(stream);
				this.loopInfoList = StructArray<LoopInfoStruct>(LoopInfoStruct.struct, this.smpl.loopCount).read(stream)
			},
			'data': (stream: Stream) => { this.dataStream = stream; },
		});

		this.stream = MediaEngine.MeStream.openData(dataBytes);

		//console.log(this.fmt);
		//console.log(this.fact);

		return this;
	}

	get bitrate() {
		var _atracBitrate = Math.floor((this.format.bytesPerFrame * 352800) / 1000);
		if (this.codecType == CodecType.PSP_MODE_AT_3_PLUS) {
			return ((_atracBitrate >> 11) + 8) & 0xFFFFFFF0;
		}
		else {
			return (_atracBitrate + 511) >> 10;
		}
	}

	get maximumSamples() {
		this.format.compressionCode
		switch (this.codecType) {
			case CodecType.PSP_MODE_AT_3_PLUS: return 0x800;
			case CodecType.PSP_MODE_AT_3: return 0x400;
			default: throw (new Error("Unknown codec type"));
		}
	}

	get endSample() {
		return this.fact.endSample;
	}

	getNumberOfSamplesInNextFrame() {
		return Math.min(this.maximumSamples, this.endSample - this.currentSample);
	}

	get remainingFrames() {
		if (this.format.blockSize == 0) return -1;
		return (this.dataStream.available / this.format.blockSize);
	}

	get decodingReachedEnd() {
		return this.remainingFrames <= 0;
	}

	//private static useWorker = false;
	private static useWorker = true;
	private packet: MediaEngine.MePacket = null;

	decodeAsync(samplesOutPtr: Stream) {
		if (this.dataStream.available < this.format.blockSize) return Promise2.resolve(0);
		var blockData = this.dataStream.readBytes(this.format.blockSize);
		this.currentSample++;
		
		var outPromise: Promise2<Uint16Array>;
		
		try {
			do {
				if (this.packet == null) {
					this.packet = this.stream.readPacket();
					if (this.packet == null) {
						return Promise2.resolve(0);
					}
				}
				var data = this.packet.decodeAudio(this.format.atracChannels, 44100);
				if (data == null) {
					this.packet.free();
					this.packet = null;
				}
			} while (data == null);
			
			//console.log(data);

			for (var n = 0; n < data.length; n++) samplesOutPtr.writeInt16(data[n]);
			return Promise2.resolve(data.length);
		} catch (e) {
			console.error(e.stack || e);
			throw e;
		}
	}

	static lastId = 0;
	static fromStreamAsync(data: Stream):Promise2<Atrac3> {
		if (typeof MediaEngine == 'undefined') {
			return waitAsync(300).then(() => {
				console.warn('MediaEngine not ready yet! Waiting 300ms to retry!');
				return this.fromStreamAsync(data);
			});
		}
		return Promise2.resolve(new Atrac3(Atrac3.lastId++).setDataStream(data));
	}
}

class FactStruct {
	endSample = 0;
	sampleOffset = 0;

	static struct = StructClass.create<FactStruct>(FactStruct, [
		{ endSample: Int32 },
		{ sampleOffset: Int32 },
	]);
}

class SmplStruct {
	unknown = [0, 0, 0, 0, 0, 0, 0];
	loopCount = 0;
	unknown2 = 0;

	static struct = StructClass.create<SmplStruct>(SmplStruct, [
		{ unknown: StructArray(Int32, 7) },
		{ loopCount: Int32 },
		{ unknown2: Int32 },
	]);
}

class LoopInfoStruct {
	cuePointID = 0;
	type = 0;
	startSample = 0;
	endSample = 0;
	fraction = 0;
	playCount = 0;

	static struct = StructClass.create<LoopInfoStruct>(LoopInfoStruct, [
		{ cuePointID: Int32 },
		{ type: Int32 },
		{ startSample: Int32 },
		{ endSample: Int32 },
		{ fraction: Int32 },
		{ playCount: Int32 },
	]);
}

class At3FormatStruct {
	compressionCode = 0;
	atracChannels = 0;
	bitrate = 0;
	averageBytesPerSecond = 0;
	blockAlignment = 0;
	bytesPerFrame = 0;
	unknown = [0, 0, 0, 0];
	omaInfo = 0;
	_unk2 = 0;
	_blockSize = 0;

	get blockSize() { return (this._blockSize & 0x3FF) * 8 + 8; }

	static struct = StructClass.create<At3FormatStruct>(At3FormatStruct, <StructEntry[]>[
		{ compressionCode: UInt16 },           // 00
		{ atracChannels: UInt16 },             // 02
		{ bitrate: UInt32 },                   // 04
		{ averageBytesPerSecond: UInt16 },     // 08
		{ blockAlignment: UInt16 },            // 0A
		{ bytesPerFrame: UInt16 },             // 0C
		{ _unk: UInt16 },                      // 0E
		{ unknown: StructArray(UInt32, 6) },   // 10
		{ _unk2: UInt16_b },                   // 28
		{ _blockSize: UInt16_b },              // 2A
	]);
}

enum CodecType {
	PSP_MODE_AT_3_PLUS = 0x00001000,
	PSP_MODE_AT_3 = 0x00001001,
}