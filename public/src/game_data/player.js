export default class Player {
    constructor(name, avatarType, nationColor) {
        this.name = name;
        this.avatarType = avatarType;
        this.nationColor = nationColor;
        this.alive = true;
        this.regions = [];
    }

    toString() {
        return `${this.name} [${this.avatarType} | ${this.nationColor}] (${this.regions.length})`;
    }
}
