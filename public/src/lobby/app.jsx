import React, { Component } from "react";
import gameEntry from "../gameEntry.js";
import { MemoryRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import LoginPage from "./pages/loginPage.jsx";
import HomePage from "./pages/homePage.jsx";
import LobbyPage from "./pages/lobbyPage.jsx";
import CreatorPage from "./pages/creatorPage.jsx";
import styled from "styled-components";
import { ToastContainer, Flip } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

class App extends Component {
    state = {
        inGame: false,
    };

    startGame = () => {
        this.setState({ inGame: true });
        gameEntry();
    };

    render() {
        return this.state.inGame ? (
            <div></div>
        ) : (
            <DivRoot>
                <ToastContainer hideProgressBar={true} transition={Flip} />
                <Router>
                    <Switch>
                        <Route path="/login">
                            <LoginPage />
                        </Route>
                        <Route path="/home">
                            <HomePage />
                        </Route>
                        <Route path="/gameJoin"></Route>
                        <Route path="/lobby/:gameid">
                            <LobbyPage />
                        </Route>
                        <Route path="/creator">
                            <CreatorPage />
                        </Route>
                        <Redirect path="/" to="/creator" />
                        {/* <Redirect path="/" to="/login" /> */}
                    </Switch>
                </Router>
            </DivRoot>
        );
    }
}

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
