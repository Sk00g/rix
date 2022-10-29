export function compareByNumber(key: string) {
    return (a, b) => {
        const valA: number = typeof a[key] === "string" ? parseFloat(a[key]) : a[key];
        const valB: number = typeof b[key] === "string" ? parseFloat(b[key]) : b[key];
        if (valA < valB) return -1;
        if (valB < valA) return 1;
        else return 0;
    };
}

export function stringCompare(a: string | null | undefined, b: string | null | undefined) {
    var valA = a ? a.toUpperCase() : "";
    var valB = b ? b.toUpperCase() : "";
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
}

// This can be placed directly inside a sort function (array.sort(utils.compareByKey('project')))
export function compareByKey(key: string) {
    return (a, b) => stringCompare(String(a[key]), String(b[key]));
}

export async function delay(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => setTimeout(() => resolve(), timeout));
}
