interface IAppContext {
    stage: PIXI.Container | null;
    playerName: string;
}

let context: IAppContext = {
    stage: null,
    playerName: "UNKNOWN",
};

export default context;
