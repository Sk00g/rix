import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import apiService from "../apiService.js";
import FatButton from "../components/fatButton.jsx";
import IconButton, { BUTTON_TYPES } from "../components/iconButton.jsx";
import LabelSelect from "../components/labelSelect.jsx";
import settings from "../../game_data/gameSettings";
import theme from "../theme";

const CreatorPage = (props) => {
    let [lobbyData, setLobbyData] = useState([]);
    let [mapList, setMapList] = useState(["Protomap"]);
    let [selectedMap, setSelectedMap] = useState("Protomap");
    const history = useHistory();

    useEffect(() => {
        apiService.getLobbyData(true).then((data) => setLobbyData(data));
        apiService.getMapList().then((list) => setMapList(list));
    }, []);

    const _handleLobbyClick = (lobby) => {
        console.log("clicked on", lobby);
    };

    const _handleMapSelect = (map) => {
        setSelectedMap(map);
    };

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton
                        type={BUTTON_TYPES.arrowLeft}
                        onClick={() => history.push("/home")}
                    />
                    <IconButton type={BUTTON_TYPES.reset} onClick={() => console.log("reset?")} />
                </div>
                <PTitle>{`Create New Game`}</PTitle>
            </DivTitlebar>
            <div style={{ display: "flex", width: "100%" }}>
                <DivColumn>
                    <div style={{ margin: "1em", marginTop: "2.5em" }}>
                        <LabelSelect
                            label="Select Map"
                            options={mapList}
                            value={selectedMap}
                            onClick={_handleMapSelect}
                        />
                        <img
                            src={`./maps/${selectedMap}/thumbnail.png`}
                            alt="mapImage"
                            width="150px"
                            height="150px"
                            style={{ marginTop: "1em" }}
                        />
                    </div>
                    <FatButton title="Create Game" onClick={() => console.log("create new game")} />
                </DivColumn>
                <DivSettings>
                    <PTitle>Settings</PTitle>
                    {/* Left off here!!! --- need to add more components for each type of setting, 
                    then switch based on that type to create the right controls, need function. Next
                    should add a question mark help button beside each, which pops up the 
                    description, which will require a modal component. Next we need a settings
                    validation function, it should just check the entire settings object and return
                    the first error it hits. Then, add reset logic to go back to defaults. Finally, 
                    we can allow game creation. */}
                    {settings.map((set) => (
                        <LabelSelect
                            key={set.key}
                            label={set.key}
                            options={Array.isArray(set.options) ? set.options : []}
                            value={set.default}
                        />
                    ))}
                </DivSettings>
            </div>
        </DivRoot>
    );
};

const DivColumn = styled.div`
    margin: 0.5em;
    width: 33%;
`;

const DivSettings = styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    margin: 0.5em;
    width: 66%;
    height: 640px;
`;

const DivRoot = styled.div`
    display: grid;
    grid-template-rows: min-content auto;
    grid-template-columns: auto;
    width: 1200px;
    height: 700px;
    background-color: ${theme.colors.dark1};
`;

const DivTitlebar = styled.div`
    margin: 0.5em;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    height: 32px;
`;

const PTitle = styled.p`
    color: ${theme.colors.fontMain};
    font-size: ${theme.fontSizeMedium};
    align-self: flex-start;
    user-select: none;
`;

export default CreatorPage;
