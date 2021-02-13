import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import apiService from "../apiService.js";
import FatButton from "../components/fatButton.jsx";
import IconButton, { BUTTON_TYPES } from "../components/iconButton.jsx";
import LabelSelect from "../components/labelSelect.jsx";
import LabelNumberInput from "../components/labelNumberInput.jsx";
import settings from "../../game_data/gameSettings";
import theme from "../theme";

/*
Work still needed for this section:
- question mark icon beside each game setting which pops up a modal with the description
- validation for the entire game settings object, make sure there are no conflicting settings, etc.
- confirmation on 'back' button press that you will be leaving any changed settings
*/

const CreatorPage = (props) => {
    let [mapList, setMapList] = useState(["Protomap"]);
    let [selectedMap, setSelectedMap] = useState("Protomap");
    let [selectedSettings, setSelectedSettings] = useState([]);

    const history = useHistory();

    const _resetSettings = async (mapName) => {
        const mapSettings = await import(`../../../dist/maps/${mapName}/defaultSettings.json`);
        let newSettings = settings.map((setting) => {
            if (setting.default === "map") setting.default = mapSettings[setting.key];
            return { ...setting, value: setting.default };
        });
        setSelectedSettings(newSettings);
    };

    useEffect(async () => {
        try {
            let mapList = await apiService.getMapList();
            setMapList(mapList);
            _resetSettings(mapList[0]);
        } catch (err) {
            console.log(`Failed gathering API data: ${err}`);
        }
    }, []);

    const _handleMapSelect = (map) => {
        setSelectedMap(map);
        _resetSettings(map);
    };

    const _handleGameCreate = () => {
        let settings = {};
        for (let set of selectedSettings) settings[set.key] = set.value;

        apiService.createLobby({
            // createdById: playerContext.active._id,
            // playerIds: [],
            gameSettings: settings,
            // mapName: selectedMap,
        });
    };

    const _updateSettingValue = (key, value) => {
        let newSettings = [...selectedSettings];
        newSettings.find((set) => set.key === key).value = value;
        setSelectedSettings(newSettings);
    };

    return (
        <DivRoot>
            <DivTitlebar>
                <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                    <IconButton type={BUTTON_TYPES.arrowLeft} onClick={() => history.push("/home")} />
                    <IconButton type={BUTTON_TYPES.reset} onClick={() => _resetSettings(mapList[0])} />
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
                            width="250px"
                            height="250px"
                            style={{ marginTop: "1em" }}
                        />
                    </div>
                    <FatButton title="Create Game" onClick={_handleGameCreate} />
                </DivColumn>
                <DivSettings>
                    <PTitle>Settings</PTitle>
                    {selectedSettings.map((set) => {
                        if (Array.isArray(set.options)) {
                            return (
                                <LabelSelect
                                    key={set.key}
                                    label={set.key}
                                    options={Array.isArray(set.options) ? set.options : []}
                                    value={set.value}
                                    handleChange={(val) => _updateSettingValue(set.key, val)}
                                />
                            );
                        } else if (set.options.includes("-")) {
                            return (
                                <LabelNumberInput
                                    key={set.key}
                                    label={set.key}
                                    value={set.value}
                                    min={set.options.split("-")[0]}
                                    max={set.options.split("-")[1]}
                                    handleChange={(val) => _updateSettingValue(set.key, val)}
                                />
                            );
                        }
                    })}
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
