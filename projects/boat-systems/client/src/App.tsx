import React from 'react';
import {Menu} from "./menu/Menu";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {CompassPage} from "./pages/compass/CompassPage";
import {AutopilotPage} from "./pages/autopilot/AutopilotPage";
import {EnginePage} from "./pages/engine/EnginePage";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Subscribe} from "@react-rxjs/core";

export const App = () => (
    <BrowserRouter>
        <Subscribe>
            <div style={{flexDirection: 'row', display: 'flex'}}>
                <div><Menu/></div>
                <div style={{flex: 1}}>
                    <Routes>
                        <Route path="/compass" element={<CompassPage/>}/>
                        <Route path="/autopilot" element={<AutopilotPage/>}/>
                        <Route path="/engine" element={<EnginePage/>}/>
                    </Routes>
                </div>
            </div>
        </Subscribe>
    </BrowserRouter>
);


