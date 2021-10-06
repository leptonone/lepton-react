/*
Copyright 2021 Lepton Interaction.

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

import { ActionPayload } from "../payloads";
import { Action } from "../actions";

export interface SwitchSpacePayload extends ActionPayload {
    action: Action.SwitchSpace;

    /**
     * The number of the space to switch to, 1-indexed, 0 is Home.
     */
    num: number;
}
