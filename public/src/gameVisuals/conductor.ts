/**
 * Conductor class, responsible for managing the visuals of playing back previous turns
 * - iterate all contested regions:
 *      # show all movements related to the region with arrows (green vs red)
 *          smaller avatars with number, border clashes move 33% of way, regular movements are 50%
 *      # animate friendly movements
 *      # animate border clashes (winner walks to the moving region 50%)
 *      # animated the fight for this region (if still relevant)
 *      # if region has been occupied, animate winner(s) moving to region and existing avatar dying
 *
 * - animate fights:
 */

import { RegionLayer } from "./regionLayer";
import * as V from "../vector";
import * as PIXI from "pixi.js";
import { CombatRoll, CommandSet, GameState, MapState, PlayerCommand } from "../../../model/gameplay";
import GameDataHandler from "../gameData/gameDataHandler";
import UnitAvatar from "../sengine/unitAvatar";
import AppContext from "../appContext";
import graphics from "../gameData/graphics";
import Region from "../gameData/region";
import RegionPathMarker from "../sengine/regionPathMarker";
import { logService, LogLevel } from "../logService";
import { compareByNumber, delay } from "../../../utils";
import Label from "../sengine/suie/label";
import assetLoader from "../assetLoader";
import { DiceCounter } from "./diceCounter";
import { Direction } from "../sengine/model";

interface ReplayAction {
    execute: () => Promise<void>;
}

const ATTACK_ARROW_COLOR = 0xff6060;
const MOVE_ARROW_COLOR = 0x60ff60;

type CommandVisual = {
    command: PlayerCommand;
    avatar: UnitAvatar;
    marker: RegionPathMarker;
};

export default class Conductor {
    private _handler: GameDataHandler;
    private _currentState: GameState;
    private _regionVisuals: RegionLayer;

    private _deployAvatars: { [region: string]: UnitAvatar };
    private _commandVisuals: CommandVisual[] = [];
    private _placeholderAvatars: UnitAvatar[] = [];
    private _diceCounters: { [player: string]: DiceCounter } = {};
    private _rollsCopy: CombatRoll[] = []; // Copy from game state, use to keep track of remaining rolls
    private _commandsCopy: PlayerCommand[] = [];
    private _remainderActions: PlayerCommand[] = [];
    private _removedCommands: PlayerCommand[] = [];

    private _turn: number;
    private _actions: ReplayAction[] = [];
    private _actionIndex = 0;

    constructor(handler: GameDataHandler, state: GameState, regionVisuals: RegionLayer) {
        // Need to deep copy this data to avoid affecting the original state when changing values
        // throughout conduction
        this._currentState = state;
        this._regionVisuals = regionVisuals;
        this._handler = handler;
    }

    loadTurn(turn: number) {
        logService(LogLevel.DEBUG, `Loading new turn ${turn}`);

        this._turn = turn;
        this._rollsCopy = [...(this._currentState.turnHistory[turn - 1].rolls ?? [])];
        this._commandsCopy = JSON.parse(JSON.stringify(this._currentState.turnHistory[this._turn - 1].commands));
        this._remainderActions = [];
        this._removedCommands = [];
        this._placeholderAvatars = [];
        this._commandVisuals = [];
        this._diceCounters = {};
        this._deployAvatars = {};

        this._initializeRegions();
        this._setupDeployments();

        const friendlies = this._prepareFriendlies();
        logService(LogLevel.DEBUG, `Generated ${friendlies.length} friendly actions`);

        const clashes = this._prepareBorderClashActions();
        logService(LogLevel.DEBUG, `Generated ${clashes.length} border clash actions`);

        const battles = this._prepareBattles();
        logService(LogLevel.DEBUG, `Generated ${battles.length} battle actions`);

        this._actions = [
            { execute: () => this._animateDeployments() },
            { execute: () => this._setupActions() },
            ...clashes,
            ...friendlies,
            ...battles,
        ];
        this._actionIndex = 0;
    }

    async next(): Promise<boolean> {
        await this._actions[this._actionIndex].execute();
        this._actionIndex++;
        return this._actionIndex === this._actions.length;
    }

    async _animateDeployments() {
        for (let key in this._deployAvatars) {
            let avatar = this._deployAvatars[key];
            avatar.setCounterVisibility(false);
            avatar.walk([avatar.getPosition()[0] + 25, avatar.getPosition()[1]]);
            avatar.fade(1, 0.1);
        }

        await delay(400);

        for (let key in this._deployAvatars) {
            this._deployAvatars[key].destroy();
            delete this._deployAvatars[key];
        }

        const deploys = this._currentState.turnHistory[this._turn - 1].deployments;
        for (let deploy of deploys) {
            const region = this._handler.getRegion(deploy.target);
            region.size = region.size + deploy.amount;
            this._animateNumberChange(region.avatar, region.size);
        }
    }

    _animateFriendlyMove(command: PlayerCommand): ReplayAction {
        return {
            execute: async () => {
                logService(
                    LogLevel.DEBUG,
                    `Animating ${command.amount} armies from ${command.origin} to ${command.target}`
                );
                const targetRegion = this._handler.getRegion(command.target);
                const visual = this._getCommandVisual(command);
                const duration = visual.avatar.calculateWalkDuration(targetRegion.visual.getUnitCenter());
                visual.avatar.walk(targetRegion.visual.getUnitCenter());

                // TODO - delay based on distance
                await delay(duration);

                this._removeCommandVisual(visual);
                targetRegion.size += command.amount;
                this._animateNumberChange(targetRegion.avatar, targetRegion.size);
            },
        };
    }

    _getCommandAvatar(command: PlayerCommand): UnitAvatar {
        const region = this._handler.getRegion(command.origin);
        const avatar =
            command.origin === command.target
                ? region.avatar
                : this._commandVisuals.find((cv) => cv.command === command)?.avatar;
        if (!avatar) throw new Error(`Impossible situation - command has no visual ${JSON.stringify(command)}`);

        return avatar;
    }

    _generateBattleAction(commands: PlayerCommand[]): ReplayAction {
        return {
            execute: async () => {
                logService(LogLevel.DEBUG, `Animating conflict between armies ${JSON.stringify(commands)}`);
                const origins = commands.map((cmd) => this._handler.getRegion(cmd.origin));
                const targets = commands.map((cmd) => this._handler.getRegion(cmd.target));
                for (let region of this._handler.getRegions()) {
                    if (![...origins, ...targets].includes(region))
                        region.visual.setStyle({ fillAlpha: 0, outlineAlpha: 0 });
                }

                // Walk animated the defending avatar
                targets[0].avatar.playWalkAnimation(true);

                // Move attack avatar(s) to within set distance of target
                const visuals = this._commandVisuals.filter((vs) => commands.includes(vs.command));
                for (let visual of visuals) {
                    const origin = this._handler.getRegion(visual.command.origin);
                    const target = this._handler.getRegion(visual.command.target);
                    let originCenter = origin.visual.getUnitCenter();
                    let targetCenter = target.visual.getUnitCenter();
                    let difference = V.subtract(targetCenter, originCenter);
                    let direction = V.normalize(difference);
                    let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) - 80));
                    visual.avatar.walk([newPos[0], newPos[1]]);
                    visual.avatar.facePoint(target.visual.getUnitCenter());
                }

                await delay(500);

                for (let command of commands) {
                    const avatar = this._getCommandAvatar(command);
                    // Assign the dice counter to the largest army per player
                    if (
                        !(command.player in this._diceCounters) ||
                        this._diceCounters[command.player]._value < command.amount
                    )
                        this._diceCounters[command.player] = new DiceCounter(AppContext.stage, avatar);
                }

                // Loop through rolls until winner is determined, animating each round
                while (true) {
                    for (let player in this._diceCounters) this._diceCounters[player].startRoll();
                    await delay(400);

                    let rolls: { [player: string]: CombatRoll } = {};

                    // Gather rolls for each player still in the fight
                    for (let cmd of commands.filter((cmd) => cmd.amount > 0)) {
                        if (cmd.player in rolls) continue; // Only need one roll per player
                        rolls[cmd.player] = this._getRollFromCommand(cmd);
                        this._diceCounters[cmd.player].setNumber(rolls[cmd.player].value);
                    }

                    await delay(100);

                    // Find the lowest rolling command
                    let lowestRoll = 100;
                    let lowestPlayer: string = "";
                    for (let player in rolls) {
                        const commandRoll = rolls[player];
                        if (!commandRoll) throw new Error("This can never happen");

                        if (commandRoll.value < lowestRoll) {
                            lowestPlayer = player;
                            lowestRoll = commandRoll.value;
                        }
                    }

                    // lowest rolling player loses unit from largest army
                    const losingCommands = commands
                        .filter((cmd) => cmd.player === lowestPlayer)
                        .sort(compareByNumber("amount"));
                    const reducedCommand = losingCommands[losingCommands.length - 1];
                    reducedCommand.amount--;
                    if (reducedCommand.amount < 0) throw new Error("broke something");

                    const reducedAvatar = this._getCommandAvatar(reducedCommand);
                    reducedAvatar.shake(3);
                    reducedAvatar.stopAnimation(true);
                    this._animateNumberChange(reducedAvatar, reducedCommand.amount);
                    // TODO - blood animation?

                    await delay(500);

                    if (reducedCommand.amount === 0) {
                        reducedAvatar.playDeathAnimation();
                        reducedAvatar.setCounterVisibility(false);
                        if (reducedCommand.origin !== reducedCommand.target) {
                            const visual = this._getCommandVisual(reducedCommand);
                            visual.marker.destroy();
                        }

                        // If all of this player's armies are at zero, remove their dice counter
                        if (commands.filter((cmd) => cmd.player === lowestPlayer && cmd.amount > 0).length === 0) {
                            this._diceCounters[reducedCommand.player].destroy();
                            delete this._diceCounters[reducedCommand.player];
                        }
                    } else reducedAvatar.playWalkAnimation(true);

                    // Exit when there is only one player with army left
                    let activePlayers = Array.from(
                        new Set(commands.filter((cmd) => cmd.amount > 0).map((cmd) => cmd.player))
                    );
                    if (activePlayers.length === 1) {
                        for (let hash in this._diceCounters) this._diceCounters[hash].destroy();
                        this._diceCounters = {};

                        const winningCommands = commands.filter(
                            (cmd) => cmd.player === activePlayers[0] && cmd.amount > 0
                        );
                        const origin = this._handler.getRegion(winningCommands[0].target);
                        const originCenter = origin.visual.getUnitCenter();

                        let walkDuration = 500;
                        for (let cmd of winningCommands) {
                            if (cmd.origin === cmd.target) continue;
                            const visual = this._getCommandVisual(cmd);
                            visual.marker.destroy();
                            const duration = visual.avatar.calculateWalkDuration(originCenter);
                            if (duration > walkDuration) walkDuration = duration;
                            visual.avatar.walk(originCenter);
                        }

                        await delay(walkDuration);

                        if (winningCommands.length > 1) {
                            for (let cmd of winningCommands) {
                                const avatar = this._getCommandAvatar(cmd);
                                const index = this._commandVisuals.findIndex((cv) => cv.avatar === avatar);
                                if (index !== -1) this._commandVisuals.splice(index, 1);
                                avatar.destroy();
                            }

                            const player = this._currentState.players.find(
                                (p) => p.username === winningCommands[0].player
                            );
                            if (!player) throw new Error(`Impossible condition, command has no player ${player}`);
                            const placeholder = new UnitAvatar(
                                AppContext.stage,
                                graphics.avatar[player.avatar],
                                player.color
                            );
                            placeholder.setPosition(originCenter);
                            this._animateNumberChange(
                                placeholder,
                                winningCommands.reduce((prev, cur) => prev + cur.amount, 0)
                            );
                            this._placeholderAvatars.push(placeholder);
                            await delay(200);
                        } else {
                            this._getCommandAvatar(winningCommands[0]).stopAnimation(true);
                            this._getCommandAvatar(winningCommands[0]).setDirection(Direction.Down);
                        }

                        await delay(500);

                        for (let region of this._handler.getRegions()) region.visual.resetStyle();
                        break;
                    }

                    await delay(300);
                }
            },
        };
    }

    _getRollFromCommand(command: PlayerCommand): CombatRoll {
        const nextMatch = this._rollsCopy.find(
            (roll) => roll.target === command.target && roll.player === command.player
        );
        if (!nextMatch) throw new Error(`Hit serious error, no matching roll for conflict: ${JSON.stringify(command)}`);
        this._rollsCopy.splice(this._rollsCopy.indexOf(nextMatch), 1);
        return nextMatch;
    }

    _getCommandHash(cmd: PlayerCommand): string {
        return `${cmd.player}|${cmd.origin}`;
    }
    _getCommandFromHash(commands: PlayerCommand[], hash: string): PlayerCommand {
        const [player, origin] = hash.split("|");
        const match = commands.find((cmd) => cmd.player === player && cmd.origin === origin);
        if (!match)
            throw new Error(`Impossible situation, hash '${hash}' has no command match ${JSON.stringify(commands)}`);
        return match;
    }

    _findRemainder(commands: PlayerCommand[]): PlayerCommand {
        while (true) {
            let rolls: { [hash: string]: CombatRoll } = {};

            // Gather rolls for each command still in the fight
            for (let cmd of commands.filter((cmd) => cmd.amount > 0))
                rolls[this._getCommandHash(cmd)] = this._getRollFromCommand(cmd);

            // Find the lowest rolling commands
            let lowestRoll = 100;
            let lowestCommands: PlayerCommand[] = [];
            for (let hash in rolls) {
                const commandRoll = rolls[hash];
                if (!commandRoll) throw new Error("This can never happen");

                if (commandRoll.value < lowestRoll) {
                    lowestCommands = [this._getCommandFromHash(commands, hash)];
                    lowestRoll = commandRoll.value;
                } else if (commandRoll.value === lowestRoll) {
                    lowestCommands.push(this._getCommandFromHash(commands, hash));
                }
            }

            const lowestPlayers = lowestCommands.map((cmd) => cmd.player);
            const damagedPlayer = lowestPlayers[0];

            // lowest rolling player loses unit from largest army
            const losingCommands = commands
                .filter((cmd) => cmd.player === damagedPlayer)
                .sort(compareByNumber("amount"));
            const reducedCommand = losingCommands[losingCommands.length - 1];
            reducedCommand.amount--;
            if (reducedCommand.amount < 0) throw new Error("broke something");

            // Exit when there is only one player with army left
            let activePlayers = Array.from(new Set(commands.filter((cmd) => cmd.amount > 0).map((cmd) => cmd.player)));
            if (activePlayers.length === 1) {
                const playerCommands = commands.filter((cmd) => cmd.player === activePlayers[0]);
                return {
                    origin: playerCommands[0].origin,
                    target: playerCommands[0].target,
                    player: activePlayers[0],
                    amount: playerCommands.reduce((prev, cur) => prev + cur.amount, 0),
                };
            }
        }
    }

    _prepareFriendlies(): ReplayAction[] {
        const actions: ReplayAction[] = [];

        const contested: string[] = this._getAvailableActions().reduce(
            (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
            []
        );

        for (let regionName of contested) {
            let incoming = this._getAvailableActions().filter((cmd) => cmd.target === regionName);
            if (incoming.filter((cmd) => cmd.player !== this._getOriginalOwner(regionName)).length === 0) {
                for (let friendlyMove of incoming) {
                    this._removedCommands.push(friendlyMove);
                    actions.push(this._animateFriendlyMove(friendlyMove));
                }
            }
        }

        return actions;
    }

    _prepareBattles(): ReplayAction[] {
        const actions: ReplayAction[] = [];

        // By this stage, all friendly moves and border clashes are resolved, so any remaining contested regions
        // are regular battles
        const contested: string[] = this._getAvailableActions().reduce(
            (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
            []
        );

        for (let regionName of contested) {
            const regionCommand: PlayerCommand = {
                player: this._getOriginalOwner(regionName),
                origin: regionName,
                target: regionName,
                amount: this._handler.getRegion(regionName).size,
            };
            let incoming = this._getAvailableActions().filter((cmd) => cmd.target === regionName);
            actions.push(this._generateBattleAction([regionCommand, ...incoming]));
            this._removedCommands.push(...incoming);
        }

        return actions;
    }

    _prepareBorderClashActions(): ReplayAction[] {
        const actions: ReplayAction[] = [];

        const contested: string[] = this._getAvailableActions().reduce(
            (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
            []
        );
        for (let regionName of contested) {
            let incoming = this._getAvailableActions().filter((cmd) => cmd.target === regionName);
            const outgoing = this._getAvailableActions().filter((cmd) => cmd.origin === regionName);

            // If there are border clashes, resolve these first to match the execution logic
            for (let command of outgoing) {
                let incomingClash = incoming.find((cmd) => cmd.target === regionName);
                if (incomingClash) {
                    console.log(`adding action to resolve clash between ${command.origin} and ${incomingClash.origin}`);
                    actions.push(this._generateBattleAction([command, incomingClash]));

                    // Remove original commands and replace with the 'remainder' command
                    this._removedCommands.push(command);
                    this._removedCommands.push(incomingClash);
                    this._remainderActions.push(this._findRemainder([command, incomingClash]));
                }
            }
        }

        return actions;
    }

    async _setupActions() {
        for (let command of this._commandsCopy) {
            const region = this._handler.getRegion(command.origin);
            region.size -= command.amount;
            this._animateNumberChange(region.avatar, region.size);
            this._animateCommandSetup(command);
        }
    }

    _setupDeployments() {
        for (let key in this._deployAvatars) {
            this._deployAvatars[key].destroy();
            delete this._deployAvatars[key];
        }

        const deploys = this._currentState.turnHistory[this._turn - 1].deployments;
        for (let deploy of deploys) {
            const region = this._handler.getRegion(deploy.target);
            let unitCenter = region.visual.getUnitCenter();
            let avatar = new UnitAvatar(AppContext.stage, graphics.avatar[region.owner.avatar], 0x99999c);
            avatar.sprite.alpha = 0.75;
            avatar.sprite.scale.set(1.2, 1.2);
            avatar.setPosition([unitCenter[0] - 25, unitCenter[1] + 8]);
            avatar.setCounter(deploy.amount);
            avatar.playWalkAnimation(true);

            this._deployAvatars[region.name] = avatar;
        }
    }

    _initializeRegions() {
        const mapState = this._getMapState();
        for (let region of this._handler.getRegions()) {
            region.size = mapState[region.name].size;

            // Circular relationship where players have regions, and each region has owner
            const owner = this._currentState.players.find((p) => p.username === mapState[region.name].owner);
            if (!owner) throw new Error("Impossible for a region to not have an owner!");
            region.owner = owner;

            region.destroy();
            region.renderAvatar();
        }
    }

    _animateNumberChange(avatar: UnitAvatar, amount: number) {
        avatar.morphNumber(1.3, 0.1);
        avatar.blendNumberColor("#ffd700", 10);

        setTimeout(() => avatar.setCounter(amount), 300);

        setTimeout(() => {
            avatar.morphNumber(1.0, 0.2);
            avatar.blendNumberColor("#ffffff", 15);
        }, 600);
    }

    _animateCommandSetup(command: PlayerCommand) {
        const origin = this._handler.getRegion(command.origin);
        const target = this._handler.getRegion(command.target);

        // Create marker path between regions
        let pathColor = origin.owner === target.owner ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        const marker = new RegionPathMarker(AppContext.stage, origin.visual, target.visual, pathColor);
        marker.setAlpha(0.75);

        // Create avatar to represent 'moving troops'
        const avatar = new UnitAvatar(AppContext.stage, graphics.avatar[origin.owner.avatar], origin.owner.color);
        let unitCenter = origin.visual.getUnitCenter();
        avatar.sprite.alpha = 1.0;
        avatar.setPosition([unitCenter[0] - 25, unitCenter[1] + 8]);
        avatar.sprite.scale.set(1.7, 1.7);
        avatar.setCounterVisibility(false);
        avatar.setCounter(command.amount);

        // Move avatar to halfway point between two regions
        let originCenter = origin.visual.getUnitCenter();
        let targetCenter = target.visual.getUnitCenter();
        let difference = V.subtract(targetCenter, originCenter);
        let direction = V.normalize(difference);
        let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) / 2));
        avatar.walk([newPos[0], newPos[1]]);
        avatar.facePoint(target.visual.getUnitCenter());

        this._commandVisuals.push({ command, avatar, marker });

        setTimeout(() => {
            avatar.setCounterVisibility(true);
            avatar.playWalkAnimation(true);
        }, 500);
    }

    dispose() {
        for (let key in this._deployAvatars) this._deployAvatars[key].destroy();
        this._deployAvatars = {};

        for (let avatar of this._placeholderAvatars) avatar.destroy();
        this._placeholderAvatars = [];

        for (let visual of this._commandVisuals) {
            visual.marker.destroy();
            visual.avatar.destroy();
        }
        this._commandVisuals = [];

        for (let player in this._diceCounters) this._diceCounters[player].destroy();
        this._diceCounters = {};

        for (let region of this._handler.getRegions()) region.visual.resetStyle();
    }

    update(delta: number) {
        for (let key in this._deployAvatars) this._deployAvatars[key].update(delta);
        for (let avatar of this._placeholderAvatars) avatar.update(delta);
        for (let visual of this._commandVisuals) visual.avatar.update(delta);
        for (let hash in this._diceCounters) this._diceCounters[hash].update(delta);
    }

    /* HELPERS */

    _getMapState(): MapState {
        return this._turn === 1
            ? this._currentState.initialRegionState
            : this._currentState.turnHistory[this._turn - 2].endingMapState;
    }

    _getOriginalOwner(region: string): string {
        return this._getMapState()[region].owner;
    }

    _getAvailableActions(): PlayerCommand[] {
        return [...this._commandsCopy.filter((cmd) => !this._removedCommands.includes(cmd)), ...this._remainderActions];
    }

    _getCommandVisual(command: PlayerCommand): CommandVisual {
        const match = this._commandVisuals.find((cv) => cv.command === command);
        if (!match) throw new Error(`Reached impossible state, command has no visual`);
        return match;
    }

    _removeCommandVisual(visual: CommandVisual) {
        this._commandVisuals.splice(this._commandVisuals.indexOf(visual), 1);
        visual.avatar.destroy();
        visual.marker.destroy();
    }
}
