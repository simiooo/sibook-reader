import React, { useEffect } from 'react'
import pdfjs, { PDFDocumentProxy } from 'pdfjs-dist'

interface DocumentType{
    pdf?: Uint8Array;
    instance?: PDFDocumentProxy;
}

export default function Document(p: DocumentType) {

    useEffect(() =>{

    }, [])
    
  return (
    <div>Document</div>
  )
}
