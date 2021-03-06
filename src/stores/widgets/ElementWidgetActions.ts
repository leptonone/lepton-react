/*
 * Copyright 2020 Lepton Interaction.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IWidgetApiRequest } from "matrix-widget-api";

export enum ElementWidgetActions {
    ClientReady = "im.vector.ready",
    HangupCall = "im.vector.hangup",
    StartLiveStream = "im.vector.start_live_stream",
    OpenIntegrationManager = "integration_manager_open",

    /**
     * @deprecated Use MSC2931 instead
     */
    ViewRoom = "io.element.view_room",
}

/**
 * @deprecated Use MSC2931 instead
 */
export interface IViewRoomApiRequest extends IWidgetApiRequest {
    data: {
        room_id: string; // eslint-disable-line camelcase
    };
}
