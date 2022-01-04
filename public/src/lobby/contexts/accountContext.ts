import React from "react";

export interface IAccountContext {
    _id: string;
    username: string;
    gameHistory: [];
    lobbies: [];
    elo: number;
    lastLogin: Date;
}

let AccountContext = React.createContext<IAccountContext>({
    _id: "60170484a8691c4f64a47774",
    username: "Sk00g",
    gameHistory: [],
    lobbies: [],
    elo: 1000,
    lastLogin: new Date(),
});

export default AccountContext;
