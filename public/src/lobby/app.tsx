import React, { useState } from "react";
import gameEntry from "../gameEntry";
import { HashRouter as Router, Switch, Route, Redirect, useLocation } from "react-router-dom";
import LoginPage from "./pages/loginPage";
import HomePage from "./pages/homePage";
import LobbyPage from "./pages/lobbyPage";
import GameJoinPage from "./pages/gameJoinPage";
import CreatorPage from "./pages/creatorPage";
import styled from "styled-components";
import { ToastContainer, Flip } from "react-toastify";
import AccountContext from "./contexts/accountContext";
import { Account } from "../../../model/lobby";
import GamePage from "./gamePage";

const App = () => {
    const cachedAccount = localStorage.getItem("account");
    const [activeAccount, setActiveAccount] = useState<Account>(cachedAccount ? JSON.parse(cachedAccount) : undefined);

    const _updateAccount = (account: Account) => {
        setActiveAccount(account);
        localStorage.setItem("account", JSON.stringify(account));
    };

    return (
        <Router>
            <ToastContainer hideProgressBar={true} transition={Flip} />
            <Switch>
                <Route path="/login">
                    <LoginPage updateAccount={_updateAccount} />
                </Route>
                {activeAccount && (
                    <AccountContext.Provider value={activeAccount}>
                        <Route path="/manage">
                            <DivRoot>
                                <Router>
                                    <Switch>
                                        <Route path="/manage/home">
                                            <HomePage />
                                        </Route>
                                        <Route path="/manage/gameJoin">
                                            <GameJoinPage />
                                        </Route>
                                        <Route path="/manage/lobby/:id">
                                            <LobbyPage />
                                        </Route>
                                        <Route path="/manage/creator">
                                            <CreatorPage />
                                        </Route>
                                    </Switch>
                                </Router>
                            </DivRoot>
                        </Route>
                        <Route path="/game/:id">
                            <GamePage />
                        </Route>
                    </AccountContext.Provider>
                )}
                <Redirect path="/" to="/login" />
            </Switch>
        </Router>
    );
};

const DivRoot = styled.div`
    height: 100%;
    background-image: url("./graphics/ui/lobby-background1.jpg");
    background-size: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export default App;
