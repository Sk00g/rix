import React from "react";
import { Account } from "./../../../../model/lobby";

let AccountContext = React.createContext<Account>({
    _id: "60170484a8691c4f64a47774",
    username: "Sk00g",
    gameHistory: [],
    lobbies: [],
    games: [],
    elo: 1000,
    lastLogin: new Date(),
});

export default AccountContext;
