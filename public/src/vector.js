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

export function divide(vector, value) {
    return [vector[0] / value, vector[1] / value];
}

export function dotProduct(vecA, vecB) {
    return vecA[0] * vecB[0] + vecA[1] * vecB[1];
}

export function crossProduct(vecA, vecB) {
    return vecB[0] * vecA[0] - vecA[1] * vecB[1];
}

export function distanceBetween(vecA, vecB) {
    return Math.abs(norm(subtract(vecA, vecB)));
}

export function isPointWithinPolygon(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    var x = point[0],
        y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}
