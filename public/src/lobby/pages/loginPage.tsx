import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import TextInput from "../components/textInput";
import TextButton from "../components/textButton";
import styled from "styled-components";
import { toast } from "react-toastify";
import theme from "../theme";
import apiService from "../../apiService";
import { Account } from "../../../../model/lobby";

export interface LoginPageProps {
    updateAccount: (account: Account) => void;
}

const LoginPage: React.FC<LoginPageProps> = (props) => {
    let [username, setUsername] = useState<string>("Sk00g");
    let [redirect, setRedirect] = useState<boolean>(false);

    const _handleClick = async () => {
        if (!username || username.length < 3) {
            toast.warn("Username must be at least 3 characters long");
            return;
        }

        const account = await apiService.getAccountByUsername(username);
        if (!account) {
            toast.warn("Username not found");
            return;
        }

        props.updateAccount(account);
        setRedirect(true);
    };

    return redirect ? (
        <Redirect to="/home" />
    ) : (
        <DivForm>
            <PTitle>WELCOME TO PERILOUS</PTitle>
            <P>USERNAME</P>
            <TextInput value={username} handleChange={(val) => setUsername(val)} handleEnter={_handleClick} />
            <div style={{ margin: "1em" }}></div>
            <TextButton handleClick={_handleClick} text="LOGIN" />
        </DivForm>
    );
};

const PTitle = styled.p`
    font-size: ${theme.fontSizeMedium};
    color: ${theme.colors.fontMain};
    margin-bottom: 8em;
    user-select: none;
`;

const P = styled.p`
    font-size: ${theme.fontSizeSmall};
    color: ${theme.colors.fontMain};
    margin-bottom: 2em;
    user-select: none;
`;

const DivForm = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2em 5em 3em 5em;
    margin-bottom: 5em;
    background: ${theme.colors.dark1};
    box-shadow: 0px 0px 10px #00000044;
    height: 320px;
    padding-bottom: 6em;
`;

export default LoginPage;
