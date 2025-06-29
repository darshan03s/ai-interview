export const isDevMode = import.meta.env.DEV;

export const devLog = (...args: Parameters<typeof console.log>) => {
    if (isDevMode) {
        console.log(new Date().toLocaleTimeString(), ...args);
    }
};

export const devError = (...args: Parameters<typeof console.error>) => {
    if (isDevMode) {
        console.error(new Date().toLocaleTimeString(), ...args);
    }
};

export const devWarn = (...args: Parameters<typeof console.warn>) => {
    if (isDevMode) {
        console.warn(new Date().toLocaleTimeString(), ...args);
    }
};

export const devInfo = (...args: Parameters<typeof console.info>) => {
    if (isDevMode) {
        console.info(new Date().toLocaleTimeString(), ...args);
    }
};

export const devDir = (...args: Parameters<typeof console.dir>) => {
    if (isDevMode) {
        console.dir(...args);
    }
};

export const devTable = (...args: Parameters<typeof console.table>) => {
    if (isDevMode) {
        console.table(...args);
    }
};
