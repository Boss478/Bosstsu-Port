declare module 'archiver' {
  import { Transform } from 'stream';

  interface ArchiverOptions {
    zlib?: { level?: number; [key: string]: unknown };
    gzip?: boolean;
    gzipOptions?: Record<string, unknown>;
  }

  class Archiver extends Transform {
    constructor(format: 'zip' | 'tar', options?: ArchiverOptions);
    append(source: string | Buffer | NodeJS.ReadableStream, data?: { name?: string; [key: string]: unknown }): this;
    file(filepath: string, data?: { name?: string; [key: string]: unknown }): this;
    directory(dirpath: string, destpath?: string, data?: { name?: string; [key: string]: unknown }): this;
    finalize(): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipe(destination: any): this;
  }

  export = Archiver;
}
