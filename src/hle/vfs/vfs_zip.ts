﻿module hle.vfs {
	export class ZipVfs extends Vfs {
		constructor(private zip: format.zip.Zip) {
			super();
		}

		openAsync(path: string, flags: FileOpenFlags, mode: FileMode): Promise<VfsEntry> {
			try {
				return Promise.resolve(new ZipVfsFile(this.zip.get(path)));
			} catch (e) {
				return Promise.reject(e);
			}
		}
	}

	class ZipVfsFile extends VfsEntry {
		constructor(private node: format.zip.ZipEntry) {
			super();
		}

		get isDirectory() { return this.node.isDirectory; }
		get size() { return this.node.size; }
		readChunkAsync(offset: number, length: number): Promise<ArrayBuffer> { return this.node.readChunkAsync(offset, length); }
		close() { }

		private static statNode(node: format.zip.ZipEntry): VfsStat {
			return {
				name: node.name,
				size: node.size,
				isDirectory: node.isDirectory,
				timeCreation: node.date,
				timeLastAccess: node.date,
				timeLastModification: node.date,
			};
		}

		stat(): VfsStat {
			return ZipVfsFile.statNode(this.node);
		}

		enumerateAsync() {
			return Promise.resolve(this.node.getChildList().map(node => ZipVfsFile.statNode(node)));
		}
	}
}