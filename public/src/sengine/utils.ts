import { Player } from "../../../model/lobby";

export function playerToString(player: Player): string {
    return `${player.username} [${player.avatar} | ${player.color}] (${player.regions?.length ?? 0})`;
}

export function randomInt(min: number, max: number): number {
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

export function formatDatetime(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
        2,
        "0"
    )}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
        date.getSeconds()
    ).padStart(2, "0")}`;
}
