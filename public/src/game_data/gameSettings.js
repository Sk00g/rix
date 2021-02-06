/*
Exhaustive list of all game settings and their options
*/

const settings = [
    { key: "maxPlayers", options: "custom", default: 4 },
    { key: "minPlayers", options: ">2", default: null },
    { key: "victoryCondition", options: ["Death Match"], default: "Death Match" },
    { key: "initialDeploymentType", options: ["Random"], default: "Random" },
    {
        key: "neutralPresence",
        options: "0-100",
        default: "0",
        units: "%",
        description:
            "How many regions of the initial deployment will be given to neutral instead of a player",
    },
    {
        key: "initialRegionAmount",
        options: "1-999",
        default: 1,
        description: "How many armies to place on each initially allocated region",
    },
    { key: "initialRegionNeutralAmount", options: "1-999", default: 1 },
    {
        key: "initialDeployAmount",
        options: "0-999",
        default: null,
        description: "How many armies are given to deploy on the first round",
    },
    { key: "publicChatEnabled", options: [true], default: true },
    { key: "privateChatEnabled", options: [false], default: false },
    {
        key: "roundLimit",
        options: "0-999",
        default: 0,
        description:
            "Game will end after this many rounds and be decided according to existing army status. Use 0 for no limit",
    },
    {
        key: "maxTurnMisses",
        options: "0-99",
        default: 1,
        description:
            "How many turns a player can miss before being kicked. 0 means they are kicked immediately on missing.",
    },
    {
        key: "kickedPlayerResolution",
        options: ["neutral1", "neutralStay"],
        default: "neutral1",
        description:
            "Controls what happens to a player's armies and region when they are kicked from the game",
    },
    {
        key: "baseReinforcements",
        options: "1-999",
        default: "map",
        description: "Base amount of reinforcements given to each player at the start of each turn",
    },
    {
        key: "regionReinforcementFactor",
        options: "1-999",
        default: "map",
        description: "One reinforcement is given to players for each group of this many regions",
    },
    {
        key: "connectedRegionReinforcementFactor",
        options: "1-99",
        default: "map",
        description:
            "One reinforcement is given to players for their connected regions divided by this factor",
    },
    {
        key: "connectedRegionReinforcementThreshold",
        options: "1-99",
        default: "map",
        description: "Connected region networks below this amount do not give any bonus",
    },
    {
        key: "continentFactor",
        options: "0-99",
        default: 1.0,
        decimal: true,
        description: "Factor multiplied against map continent bonuses",
    },
    {
        key: "eliminationBonusType",
        options: ["flat"],
        default: "flat",
        description:
            "Controls the reward given for eliminating another player (other than the obvious fame and glory...)",
    },
    { key: "firstRoundAttackEnabled", options: [true, false], default: false },
    {
        key: "preventMismatchKills",
        options: [true, false],
        default: true,
        description:
            "When enabled, prevents an army from killing more than its amount duration multi-invasions",
    },
    {
        key: "deployLimitation",
        options: ["connected2", "none"],
        default: "connected2",
        description:
            "Controls what, if any, limitations are placed on deployment amounts per region",
    },
];

export default settings;
