declare module 'pdfjs-dist/webpack' {
  export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist/legacy/build/pdf' {
  export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs?url' {
  const workerSrc: string;
  export default workerSrc;
}
