/*
Copyright 2015 - 2021 Lepton Interaction.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";

import RoomContext from "../../../contexts/RoomContext";
import * as TextForEvent from "../../../TextForEvent";
import { replaceableComponent } from "../../../utils/replaceableComponent";

interface IProps {
    mxEvent: MatrixEvent;
}

@replaceableComponent("views.messages.TextualEvent")
export default class TextualEvent extends React.Component<IProps> {
    static contextType = RoomContext;

    public render() {
        const text = TextForEvent.textForEvent(this.props.mxEvent, true, this.context?.showHiddenEventsInTimeline);
        if (!text) return null;
        return <div className="mx_TextualEvent">{ text }</div>;
    }
}