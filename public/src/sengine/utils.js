export function RGBFromString(hexString) {
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

export const NationColor = Object.freeze({
    RED: 0xff0000,
    GREEN: 0x40ff50,
    BLUE: 0x4050ff,
});
