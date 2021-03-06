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
import { MatrixCall } from "matrix-js-sdk/src/webrtc/call";

export interface TransferCallPayload extends ActionPayload {
    action: Action.TransferCallToMatrixID | Action.TransferCallToPhoneNumber;
    // The call to transfer
    call: MatrixCall;
    // Where to transfer the call. A Lepton ID if action == TransferCallToMatrixID
    // and a phone number if action == TransferCallToPhoneNumber
    destination: string;
    // If true, puts the current call on hold and dials the transfer target, giving
    // the user a button to complete the transfer when ready.
    // If false, ends the call immediately and sends the user to the transfer
    // destination
    consultFirst: boolean;
}
