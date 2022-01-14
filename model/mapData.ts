import { Point } from "./../public/src/sengine/model";
export interface MapContinent {
    name: string;
    regionNames: string[];
    color: string;
    ownershipValue: number;
}

export interface MapRegion {
    name: string;
    borderTiles: number[][];
    unitPoint: number[];
    borderRegionNames: string[];
}

export interface MapData {
    name: string;
    maxPlayers: number;
    tilesetPath: string;
    tileMapSize: number[];
    tileSize: number[];
    scale: number;
    connectedEmpireReinforceIncrement: number;
    generalRegionReinforceIncrement: number;
    defaultReinforce: number;
    continents: MapContinent[];
    regions: MapRegion[];
    tileIndices: number[][][];
}
