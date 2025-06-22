export const isDevMode = () => import.meta.env.DEV;

export const devLog = (...args: Parameters<typeof console.log>) => {
    if (isDevMode()) {
        console.log(...args);
    }
};

export const devError = (...args: Parameters<typeof console.error>) => {
    if (isDevMode()) {
        console.error(...args);
    }
};

export const devWarn = (...args: Parameters<typeof console.warn>) => {
    if (isDevMode()) {
        console.warn(...args);
    }
};

export const devInfo = (...args: Parameters<typeof console.info>) => {
    if (isDevMode()) {
        console.info(...args);
    }
};

export const devDir = (...args: Parameters<typeof console.dir>) => {
    if (isDevMode()) {
        console.dir(...args);
    }
};

export const devTable = (...args: Parameters<typeof console.table>) => {
    if (isDevMode()) {
        console.table(...args);
    }
};
