export function subtract(vecA, vecB) {
    return [vecA[0] - vecB[0], vecA[1] - vecB[1]];
}

export function add(vecA, vecB) {
    return [vecA[0] + vecB[0], vecA[1] + vecB[1]];
}

export function norm(vector) {
    return Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
}

export function normalize(vector) {
    let n = norm(vector);
    return [vector[0] / n, vector[1] / n];
}

export function multiply(vector, value) {
    return [vector[0] * value, vector[1] * value];
}
