/*
This class holds the code that actually 'executes' the orders and resolves all the conflicts of a
turn. It is the equivalent in the board game of rolling the dice and removing / moving armies 
*/

const BASE_DICE_MIN = 1;
const BASE_DICE_MAX = 10;

class GameMaster {
    mapData: any;
    gameData: any;

    constructor(mapData, gameData) {
        this.mapData = mapData;
        this.gameData = gameData;
    }

    _getRoll(armies) {
        // Ensure we are only considering regions that have remaining units in battle
        let validArmies = armies.filter((army) => army.amount > 0);

        let diceLimits = [BASE_DICE_MIN, BASE_DICE_MAX + 1];

        // Upper limit is increased based on having multiple regions attacking
        if (validArmies.length > 1) diceLimits[1] += validArmies.length;

        // Lower limit is increased based on army size (total across regions)
        let totalArmy = validArmies.reduce((prev: number, item: any) => prev + item.amount, 0);
        if (totalArmy < 40) diceLimits[0] += Math.floor((totalArmy - 1) / 5);
        else diceLimits[0] = 7;

        return Math.floor(Math.random() * (diceLimits[1] - diceLimits[0])) + diceLimits[0];
    }

    /*
    An 'order' object is formatted as follows:
    {
        origin,     (REGION object, { })
        target,     (REGION object)
        amount      (INT)
    }
    */
    resolve(orders: any[]) {
        // Store all roll results and overall outcomes by region name key
        let outcomes = {};

        // Iterate regions that are contested
        let targets: any[] = [];
        for (let order of orders) {
            if (!targets.includes(order.target)) targets.push(order.target);
        }

        for (let region of targets) {
            // Gather incoming orders contesting this region
            let incomingOrders = orders.filter((ord) => ord.target === region);

            // Collect army lists, grouped by player
            let armies = {};
            for (let order of incomingOrders) {
                if (!(order.origin.owner in armies)) armies[order.origin.owner] = [order];
                else armies[order.origin.owner].push(order);
            }

            while (true) {
                // Calculated rolls for each player
                let rolls = {};
                for (let owner in armies) {
                    rolls[owner] = this._getRoll(armies[owner]);
                }

                // Highest rolling player kills lowest rolling
                // Adjust armies accordingly
                let lowestRoll = 100;
                let lowestArmies: any[] = [];
                for (let owner in armies) {
                    if (rolls[owner] <= lowestRoll) {
                        lowestArmies.push(armies[owner]);
                        lowestRoll = rolls[owner];
                    }
                }

                // Ties take no action
                // lowest army loses unit from random region
                let damagedArmy: any = null;
                if (lowestArmies.length === 1) {
                    damagedArmy = lowestArmies[0][Math.floor(Math.random() * lowestArmies[0].length)];
                    damagedArmy.amount--;
                }

                // Store this turn's outcome
                if (!(region in outcomes)) outcomes[region] = [];
                outcomes[region].push({
                    rolls: rolls,
                    damagedArmy: damagedArmy ? { ...damagedArmy } : null,
                    armies: { ...armies },
                });

                // Exit the 'rolling' turn loop when there is only one player with army left
                let activeArmies = Object.keys(armies).filter(
                    (owner) => armies[owner].reduce((prev, item) => prev + item.amount, 0) > 0
                );
                if (activeArmies.length === 1) break;
            }
        }

        return outcomes;
    }
}
