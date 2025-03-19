import React, { createContext, useContext, useMemo, useState } from 'react';

type PDFCacheContextType = {
  canvasCache: Map<string, OffscreenCanvas>;
  updateCache: (key: string, canvas: OffscreenCanvas) => void;
};

const PDFCacheContext = createContext<PDFCacheContextType>({
  canvasCache: new Map(),
  updateCache: () => {},
});

export const PDFCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [canvasCache, setCanvasCache] = useState<Map<string, OffscreenCanvas>>(new Map());

  const contextValue = useMemo(() => ({
    canvasCache,
    updateCache: (key: string, canvas: OffscreenCanvas) => {
      const newCache = new Map(canvasCache);
      newCache.set(key, canvas);
      setCanvasCache(newCache);
    },
  }), [canvasCache]);

  return (
    <PDFCacheContext.Provider value={contextValue}>
      {children}
    </PDFCacheContext.Provider>
  );
};

export const usePDFCache = () => {
  return useContext(PDFCacheContext);
};
