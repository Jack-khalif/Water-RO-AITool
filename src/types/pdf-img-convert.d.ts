declare module 'pdf-img-convert' {
    export function fromPath(path: string): Promise<Buffer[]>;
}
