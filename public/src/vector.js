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

export function isPointWithinPolygon(point, vertices) {
    let minX = 999999;
    let maxX = -1;
    let minY = 999999;
    let maxY = -1;
    for (let vert of vertices) {
        if (vert[0] < minX) minX = vert[0];
        else if (vert[0] > maxX) maxX = vert[0];
        if (vert[1] < minY) minY = vert[1];
        else if (vert[1] > maxY) maxY = vert[1];
    }

    return point[0] < maxX && point[0] > minX && point[1] < maxY && point[1] > minY;
}
