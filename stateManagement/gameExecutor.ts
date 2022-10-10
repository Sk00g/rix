import { CombatRoll, GameRound, GameState, MapState, PlayerCommand, PlayerDeployment } from "./../model/gameplay";
import { formatDatetime } from "../public/src/sengine/utils";

const BASE_DICE_MIN = 1;
const BASE_DICE_MAX = 10;

/** Also used by clients to build and play back turn history, or to get the current map state from game state */
export function buildMapState(game: GameState, toRound: number): MapState {
    let currentState: MapState = { ...game.initialRegionState };

    for (let i = 0; i < toRound; i++) {
        const round = game.turnHistory[i];
        currentState = _applyDeployments(currentState, round.deployments);
        const [state, _] = _applyCommands(currentState, round.commands, round.rolls);
        currentState = state;
    }

    return currentState;
}

export async function executeNextTurn(db: any, game: GameState) {
    const commands = Object.keys(game.pendingCommandSets).reduce(
        (prev: PlayerCommand[], cur: string) => [...prev, ...game.pendingCommandSets[cur].commands],
        []
    );
    const deployments = Object.keys(game.pendingCommandSets).reduce(
        (prev: PlayerDeployment[], cur: string) => [...prev, ...game.pendingCommandSets[cur].deployments],
        []
    );

    // Build the current map state from turn history and current round
    const nextRound = game.turnHistory.length;
    // let mapState = buildMapState(game, nextRound);
    let mapState = game.turnHistory[nextRound - 1]?.endingMapState ?? game.initialRegionState;

    // Apply the deployments to the map state
    mapState = _applyDeployments(mapState, deployments);

    // Apply the commands to the map state, generating rolls in the process
    const [newState, rolls] = _applyCommands(mapState, commands);

    console.log("final map state", mapState);

    // Create game round based on executions results and add to state.turnHistory
    const newRound: GameRound = {
        executedAt: formatDatetime(new Date()),
        roundNumber: nextRound,
        deployments,
        commands,
        rolls,
        endingMapState: newState,
    };

    // Clear all pendingCommandSets and write to db
    await db
        .collection("gameStates")
        .updateOne({ _id: game._id }, { $set: { pendingCommandSets: {} }, $push: { turnHistory: newRound } });
}

function _rollToResolve(
    armies: { [player: string]: PlayerCommand[] },
    existingRolls?: CombatRoll[]
): [CombatRoll[], PlayerCommand] {
    const allRolls: CombatRoll[] = [];
    let remainder: PlayerCommand;

    while (true) {
        let rolls: CombatRoll[] = [];

        for (let player in armies) {
            const newRoll = existingRolls
                ? existingRolls.pop()?.value ?? 1
                : _getRoll(armies[player].map((cmd) => cmd.amount));
            rolls.push({
                player,
                target: armies[player][0].target, // All commands in this group have the same target
                value: newRoll,
            });

            if (rolls[rolls.length - 1].value === -1) throw new Error("Roll calculations are somehow off");
            console.log("new roll generated", rolls[rolls.length - 1]);
        }

        // Find the lowest rolling players
        let lowestRoll = 100;
        let lowestPlayers: string[] = [];
        for (let player in armies) {
            const playerRoll = rolls.find((r) => r.player === player);
            if (!playerRoll) throw new Error("This can never happen");

            if (playerRoll.value < lowestRoll) {
                lowestPlayers = [player];
                lowestRoll = playerRoll.value;
            } else if (playerRoll.value === lowestRoll) {
                lowestPlayers.push(player);
            }
        }

        // Ties take no action and rolls are not recorded
        if (lowestPlayers.length > 1) {
            console.log("tie, no action");
            continue;
        }
        let damagedPlayer = lowestPlayers[0];

        // lowest rolling player loses unit from random command
        const remainingArmies = armies[damagedPlayer].filter((army) => army.amount);
        let reducedCommand = remainingArmies[Math.floor(Math.random() * remainingArmies.length)];
        reducedCommand.amount--;
        if (reducedCommand.amount < 0) throw new Error("broke something");
        console.log("reduced army size from command", reducedCommand);

        // Store these rolls as part of round history
        if (!existingRolls) allRolls.push(...rolls);

        // Exit when there is only one player with army left
        let activePlayers = Object.keys(armies).filter(
            (owner) => armies[owner].reduce((prev, item) => prev + item.amount, 0) > 0
        );
        console.log("active players", activePlayers);
        if (activePlayers.length === 1) {
            const lastCommand = armies[activePlayers[0]].find((cmd) => cmd.amount > 0);
            console.log("only", activePlayers[0], "remains, they win with", lastCommand);
            if (!lastCommand) throw new Error("This can also never happen");
            remainder = { ...lastCommand };
            break;
        }
    }

    return [allRolls, remainder];
}

function _getRoll(armies: number[]): number {
    // Ensure we are only considering regions that have remaining units in battle
    let validArmies = armies.filter((army) => army > 0);

    let diceLimits = [BASE_DICE_MIN, BASE_DICE_MAX + 1];

    // Upper limit is increased based on having multiple regions attacking
    if (validArmies.length > 1) diceLimits[1] += validArmies.length;

    // Lower limit is increased based on army size (total across regions)
    let totalArmy = validArmies.reduce((prev, cur) => prev + cur, 0);
    if (totalArmy < 40) diceLimits[0] += Math.floor((totalArmy - 1) / 5);
    else diceLimits[0] = 7;

    return Math.floor(Math.random() * (diceLimits[1] - diceLimits[0])) + diceLimits[0];
}

function _applyDeployments(mapState: MapState, deploys: PlayerDeployment[]): MapState {
    let newState = { ...mapState };
    for (let deploy of deploys) newState[deploy.target].size += deploy.amount;
    return newState;
}

/** Used when executing a turn for the first time by calling without specifying rolls. If a list of rolls are
 * specified, this function will then apply those rolls one by one instead of generating and saving them */
function _applyCommands(
    mapState: MapState,
    commands: PlayerCommand[],
    existingRolls?: CombatRoll[]
): [MapState, CombatRoll[]] {
    let originalState: MapState = { ...mapState };

    // Reduce all origin regions of their amounts
    for (let command of commands) mapState[command.origin].size -= command.amount;

    // Gather all regions that are contested
    const contested: string[] = commands.reduce(
        (prev: string[], cur) => (prev.includes(cur.target) ? prev : [...prev, cur.target]),
        []
    );
    console.log("contested regions", contested);

    const rolls: CombatRoll[] = [];
    for (let region of contested) {
        const currentOwner = mapState[region].owner;
        console.log("assessing", region, "owned by", currentOwner);
        let incoming = commands.filter((cmd) => cmd.target === region);
        const outgoing = commands.filter((cmd) => cmd.origin === region);

        // If there are only friendly armies incoming, only update map state is required
        if (incoming.filter((cmd) => originalState[cmd.origin].owner !== currentOwner).length === 0) {
            for (let friendlyMove of incoming) {
                console.log("applying friendly move of", friendlyMove);
                originalState[region].size += friendlyMove.amount;
            }
            continue;
        }

        // Resolve border clashes
        for (let command of outgoing) {
            let incomingClash = incoming.find((cmd) => cmd.origin === command.target);
            if (incomingClash) {
                console.log("border clash between", command, "and", incomingClash);
                const [newRolls, remainder] = _rollToResolve(
                    {
                        [currentOwner]: [command],
                        [mapState[incomingClash.origin].owner]: [incomingClash],
                    },
                    existingRolls
                );
                console.log("resolved border clash between", region, "and", incomingClash.origin);
                console.log("result", remainder);
                if (!existingRolls) rolls.push(...newRolls);

                // Remove original commands and replace with the 'remainder' command
                commands.splice(commands.indexOf(command), 1);
                commands.splice(commands.indexOf(incomingClash), 1);
                commands.push(remainder);
            }
        }

        // Re-calculate incoming command in the case there were border clashes that resulted in new incoming commands
        incoming = commands.filter((cmd) => cmd.target === region && cmd.amount > 0);

        // Resolve this regions conflicting commands, including the existing army as a new command
        let armies: { [player: string]: PlayerCommand[] } = {
            [currentOwner]: [{ origin: region, target: region, amount: mapState[region].size }],
        };
        for (let command of incoming) {
            let player = mapState[command.origin].owner;
            if (player in armies) armies[player].push(command);
            else armies[player] = [command];
        }

        // If the only invaders were destroyed in border clashes, do nothing
        if (Object.keys(armies).length === 1) continue;

        console.log("resolving", region, "clash with armies", armies);
        const [newRolls, remainder] = _rollToResolve(armies, existingRolls);

        // Store the rolls and apply the remainder to the map state
        if (!existingRolls) rolls.push(...newRolls);
        mapState[region].owner = originalState[remainder.origin].owner;
        mapState[region].size = remainder.amount;
    }

    return [mapState, rolls];
}
