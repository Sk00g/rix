import React, { useState } from "react";
import gameEntry from "../gameEntry";
import { HashRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import LoginPage from "./pages/loginPage";
import HomePage from "./pages/homePage";
import LobbyPage from "./pages/lobbyPage";
import GameJoinPage from "./pages/gameJoinPage";
import CreatorPage from "./pages/creatorPage";
import styled from "styled-components";
import { ToastContainer, Flip } from "react-toastify";
import AccountContext, { IAccountContext } from "./contexts/accountContext";

const App = () => {
    // ------- DEBUG ----------------------
    // let [activeAccount, setActiveAccount] = useState(null);
    let [activeAccount, setActiveAccount] = useState<IAccountContext>({
        _id: "60170484a8691c4f64a47774",
        username: "Sk00g",
        gameHistory: [],
        lobbies: [],
        elo: 1000,
        lastLogin: new Date(),
    });
    // -------------------------------------
    let [inGame, setInGame] = useState(false);

    const _startGame = () => {
        setInGame(true);
        gameEntry();
    };

    const _updateAccount = (account) => {
        setActiveAccount(account);
    };

    return inGame ? (
        <div></div>
    ) : (
        <DivRoot>
            <AccountContext.Provider value={activeAccount}>
                <ToastContainer hideProgressBar={true} transition={Flip} />
                <Router>
                    <Switch>
                        <Route path="/login">
                            <LoginPage updateAccount={_updateAccount} />
                        </Route>
                        <Route path="/home">
                            <HomePage startGame={_startGame} />
                        </Route>
                        <Route path="/gameJoin">
                            <GameJoinPage />
                        </Route>
                        <Route path="/lobby/:gameId">
                            <LobbyPage />
                        </Route>
                        <Route path="/creator">
                            <CreatorPage />
                        </Route>
                        {/* <Redirect path="/" to="/gameJoin" /> */}
                        <Redirect path="/" to="/login" />
                    </Switch>
                </Router>
            </AccountContext.Provider>
        </DivRoot>
    );
};

const DivRoot = styled.div`
    height: 100%;
    background-image: url("../../dist/graphics/ui/lobby-background1.jpg");
    background-size: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export default App;
