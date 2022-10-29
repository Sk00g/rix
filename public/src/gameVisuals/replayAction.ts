interface IAsset {
    destroy: () => void;
    update: (delta: number) => void;
}

export default class ReplayAction {
    private _action: () => Promise<void>;
    private _assets: IAsset[] = [];

    constructor(assets: IAsset[], playAction: () => Promise<void>) {
        this._action = playAction;
        this._assets = assets;
    }

    public dispose() {
        for (let asset of this._assets) asset.destroy();
    }

    public execute() {
        this._action();
    }

    public update(delta: number) {
        for (let asset of this._assets) asset.update(delta);
    }
}
