﻿///<reference path="../../global.d.ts" />

import _state = require('./gpu_state');
import _vertex = require('./gpu_vertex');

export class BaseDrawDriver {
	rehashSignal = new Signal<number>();
	enableColors: boolean = true;
	
	end(): void {
		
	}

	initAsync(): Promise2<any> {
		return Promise2.resolve();
	}

	/**
	 * Flush texture page-cache.
	 * 
	 * Do this if you have copied/rendered into an area currently in the texture-cache
	 */
	textureFlush(state: any):void {
		
	}

	/**
	 * Synchronize rendering pipeline with image upload.
	 * 
	 * This will stall the rendering pipeline until the current image upload initiated by sceGuCopyImage() has completed.
	 */
	textureSync(state: _state.GpuState):void {
		
	}
	drawElements(state: any, primitiveType: _state.PrimitiveType, vertices: _state.Vertex[], count: number, vertexInfo: _state.VertexInfo):void {
		
	}
	drawOptimized(state: any, buffer:_vertex.OptimizedDrawBuffer):void {
		
	}
}