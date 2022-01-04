export function randomInt(min, max) {
    const val = Math.floor(Math.random() * (max - min) + min);
    return val;
}

export function RGBFromString(hexString: string) {
    if (hexString.substr(0, 1) === "#") hexString = hexString.substr(1);
    let num = parseInt(hexString, 16);
    return { r: num >> 16, g: (num >> 8) & 0xff, b: num & 0xff };
}

export function StringFromRGB(rgbValues) {
    return `#${Math.max(0, rgbValues.r).toString(16).padStart(2, "0")}${Math.max(0, rgbValues.g)
        .toString(16)
        .padStart(2, "0")}${Math.max(0, rgbValues.b).toString(16).padStart(2, "0")}`;
}

export const AnimationType = Object.freeze({
    WALK: "WALK",
    STAND: "STAND",
});
