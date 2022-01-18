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
import AccountContext from "./contexts/accountContext";
import { Account } from "../../../model/lobby";
import theme from "./theme";

const App = () => {
    // ------- DEBUG ----------------------
    const [activeAccount, setActiveAccount] = useState<Account>({
        _id: "61e23edb0524f922ec9de7c2",
        username: "Sk00g",
        gameHistory: [],
        lobbies: [],
        games: [],
        elo: 1000,
        lastLogin: new Date(),
    });
    // -------------------------------------
    const [inGame, setInGame] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const _startGame = async (gameId: string) => {
        setInGame(true);
        setLoading(true);

        await gameEntry(gameId, activeAccount);

        setLoading(false);
    };

    const _updateAccount = (account: Account) => {
        setActiveAccount(account);
    };

    if (loading)
        return (
            <DivLoading>
                <PLoading>Loading...</PLoading>
            </DivLoading>
        );
    else if (inGame) {
        return <div></div>;
    } else {
        return (
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
                            <Route path="/lobby/:id">
                                <LobbyPage startGame={_startGame} />
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
    }
};

const DivLoading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PLoading = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeLarge};
    text-align: center;
    white-space: nowrap;
    user-select: none;
`;

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
