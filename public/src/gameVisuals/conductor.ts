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
import { CombatRoll, CommandSet, GameState, MapState, PlayerCommand } from "../../../model/gameplay";
import GameDataHandler from "../gameData/gameDataHandler";
import UnitAvatar from "../sengine/unitAvatar";
import AppContext from "../appContext";
import graphics from "../gameData/graphics";
import Region from "../gameData/region";
import RegionPathMarker from "../sengine/regionPathMarker";
import { logService, LogLevel } from "../logService";

interface ReplayAction {
    execute: () => void;
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
    private _rollsCopy: CombatRoll[] = []; // Copy from game state, use to keep track of remaining rolls
    private _remainderActions: PlayerCommand[] = [];
    private _removedCommands: PlayerCommand[] = [];

    private _turn: number;
    private _actions: ReplayAction[] = [];
    private _actionIndex = 0;

    constructor(handler: GameDataHandler, state: GameState, regionVisuals: RegionLayer) {
        this._currentState = state;
        this._regionVisuals = regionVisuals;
        this._handler = handler;

        this._deployAvatars = {};
    }

    loadTurn(turn: number) {
        logService(LogLevel.DEBUG, `Loading new turn ${turn}`);

        this._turn = turn;
        this._rollsCopy = [...(this._currentState.turnHistory[turn - 1].rolls ?? [])];
        this._remainderActions = [];
        this._removedCommands = [];
        this._commandVisuals = [];

        this._initializeRegions();
        this._setupDeployments();

        const clashes = this._prepareBorderClashActions();
        logService(LogLevel.DEBUG, `Generated ${clashes.length} border clash actions`);

        const friendlies = this._prepareFriendlies();
        logService(LogLevel.DEBUG, `Generated ${friendlies.length} friendly actions`);

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

    next() {
        this._actions[this._actionIndex].execute();
        this._actionIndex++;
    }

    _animateDeployments() {
        for (let key in this._deployAvatars) {
            let avatar = this._deployAvatars[key];
            avatar.setCounterVisibility(false);
            avatar.walk([avatar.getPosition()[0] + 25, avatar.getPosition()[1]]);
            avatar.fade(1, 0.1);
        }

        setTimeout(() => {
            for (let key in this._deployAvatars) this._deployAvatars[key].destroy();
            const deploys = this._currentState.turnHistory[this._turn - 1].deployments;
            for (let deploy of deploys) {
                const region = this._handler.getRegion(deploy.target);
                region.size = region.size + deploy.amount;
                this._animateNumberChange(region);
            }
        }, 400);
    }

    _animateFriendlyMove(command: PlayerCommand): ReplayAction {
        return {
            execute: () => {
                logService(
                    LogLevel.DEBUG,
                    `Animating ${command.amount} armies from ${command.origin} to ${command.target}`
                );
                const targetRegion = this._handler.getRegion(command.target);
                const visual = this._getCommandVisual(command);
                const duration = visual.avatar.calculateWalkDuration(targetRegion.visual.getUnitCenter());
                console.log("walk duration", duration);
                visual.avatar.walk(targetRegion.visual.getUnitCenter());

                // TODO - delay based on distance
                setTimeout(() => {
                    this._removeCommandVisual(visual);
                    targetRegion.size += command.amount;
                    this._animateNumberChange(targetRegion);
                }, duration);
            },
        };
    }

    _generateBattleAction(commands: PlayerCommand[]): ReplayAction {
        return {
            execute: () => {
                /**
                 * Dim all avatars except these commands
                 * Temporarily hide arrows
                 * Move avatars within set distance of target center (50) (for clashes, halfway point)
                 * Face avatars to the middle
                 * delay
                 * display dice blocks above each command avatar
                 *
                 */
            },
        };
    }

    _findRemainder(commands: PlayerCommand[]): PlayerCommand {
        // const incomingRegion = this._handler.getRegion(incomingClash.origin);
        // const incomingRolls = state.rolls.filter(
        //     (r) => r.player === incomingRegion.owner.username && r.target === regionName
        // );
        // const outgoingRolls = state.rolls.filter(
        //     (r) => r.player === currentOwner && r.target === incomingRegion.name
        // );

        let remainder: PlayerCommand = { origin: "", target: "", amount: 0 };

        // while (true) {
        //     let rolls: CombatRoll[] = [];

        //     for (let player in armies) {
        //         const newRoll = existingRolls
        //             ? existingRolls.pop()?.value ?? 1
        //             : _getRoll(armies[player].map((cmd) => cmd.amount));
        //         rolls.push({
        //             player,
        //             target: armies[player][0].target, // All commands in this group have the same target
        //             value: newRoll,
        //         });

        //         if (rolls[rolls.length - 1].value === -1) throw new Error("Roll calculations are somehow off");
        //         console.log("new roll generated", rolls[rolls.length - 1]);
        //     }

        //     // Find the lowest rolling players
        //     let lowestRoll = 100;
        //     let lowestPlayers: string[] = [];
        //     for (let player in armies) {
        //         const playerRoll = rolls.find((r) => r.player === player);
        //         if (!playerRoll) throw new Error("This can never happen");

        //         if (playerRoll.value < lowestRoll) {
        //             lowestPlayers = [player];
        //             lowestRoll = playerRoll.value;
        //         } else if (playerRoll.value === lowestRoll) {
        //             lowestPlayers.push(player);
        //         }
        //     }

        //     // Ties take no action and rolls are not recorded
        //     if (lowestPlayers.length > 1) {
        //         console.log("tie, no action");
        //         continue;
        //     }
        //     let damagedPlayer = lowestPlayers[0];

        //     // lowest rolling player loses unit from random command
        //     const remainingArmies = armies[damagedPlayer].filter((army) => army.amount);
        //     let reducedCommand = remainingArmies[Math.floor(Math.random() * remainingArmies.length)];
        //     reducedCommand.amount--;
        //     if (reducedCommand.amount < 0) throw new Error("broke something");
        //     console.log("reduced army size from command", reducedCommand);

        //     // Store these rolls as part of round history
        //     if (!existingRolls) allRolls.push(...rolls);

        //     // Exit when there is only one player with army left
        //     let activePlayers = Object.keys(armies).filter(
        //         (owner) => armies[owner].reduce((prev, item) => prev + item.amount, 0) > 0
        //     );
        //     console.log("active players", activePlayers);
        //     if (activePlayers.length === 1) {
        //         const lastCommand = armies[activePlayers[0]].find((cmd) => cmd.amount > 0);
        //         console.log("only", activePlayers[0], "remains, they win with", lastCommand);
        //         if (!lastCommand) throw new Error("This can also never happen");
        //         remainder = { ...lastCommand };
        //         break;
        //     }
        // }

        return remainder;
    }

    _prepareFriendlies(): ReplayAction[] {
        const actions: ReplayAction[] = [];

        const contested: string[] = this._getAvailableActions().reduce(
            (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
            []
        );
        for (let regionName of contested) {
            let incoming = this._getAvailableActions().filter((cmd) => cmd.target === regionName);

            if (
                incoming.filter((cmd) => this._getOriginalOwner(cmd.origin) !== this._getOriginalOwner(regionName))
                    .length === 0
            ) {
                for (let friendlyMove of incoming) {
                    this._removedCommands.push(friendlyMove);
                    actions.push(this._animateFriendlyMove(friendlyMove));
                }
            }
        }

        return actions;
    }

    _prepareBattles(): ReplayAction[] {
        return [];
    }

    _prepareBorderClashActions(): ReplayAction[] {
        const actions: ReplayAction[] = [];
        const state = this._currentState.turnHistory[this._turn - 1];

        const contested: string[] = state.commands.reduce(
            (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
            []
        );
        for (let regionName of contested) {
            let incoming = state.commands.filter((cmd) => cmd.target === regionName);
            const outgoing = state.commands.filter((cmd) => cmd.origin === regionName);

            // If there are border clashes, resolve these first to match the execution logic
            for (let command of outgoing) {
                let incomingClash = incoming.find((cmd) => cmd.origin === command.target);
                if (incomingClash) {
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

    _setupActions() {
        const state = this._currentState.turnHistory[this._turn - 1];

        for (let command of state.commands) {
            const region = this._handler.getRegion(command.origin);
            region.size -= command.amount;
            region.avatar.morph(1.3, 0.5);
            region.avatar.fade(0.8, 0.5);
            this._animateNumberChange(region);
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

            region.renderAvatar();
        }
    }

    _animateNumberChange(region: Region) {
        region.avatar.morphNumber(1.3, 0.1);
        region.avatar.blendNumberColor("#ffd700", 10);

        setTimeout(() => region.avatar.setCounter(region.size), 300);

        setTimeout(() => {
            region.avatar.morphNumber(1.0, 0.2);
            region.avatar.blendNumberColor("#ffffff", 15);
        }, 1000);
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
        for (let visual of this._commandVisuals) {
            visual.marker.destroy();
            visual.avatar.destroy();
        }
    }

    update(delta: number) {
        for (let key in this._deployAvatars) this._deployAvatars[key].update(delta);
        for (let visual of this._commandVisuals) visual.avatar.update(delta);
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
        return [
            ...this._currentState.turnHistory[this._turn - 1].commands.filter(
                (cmd) => !this._removedCommands.includes(cmd)
            ),
            ...this._remainderActions,
        ];
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
