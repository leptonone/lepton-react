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

const { createSpace, inviteSpace } = require("../usecases/create-space");

module.exports = async function spacesScenarios(alice, bob) {
    console.log(" creating a space for spaces scenarios:");

    await alice.delay(1000); // wait for dialogs to close
    await setupSpaceUsingAliceAndInviteBob(alice, bob);
};

const space = "Test Space";

async function setupSpaceUsingAliceAndInviteBob(alice, bob) {
    await createSpace(alice, space);
    await inviteSpace(alice, space, "@bob:localhost");
    await bob.query(`.mx_SpaceButton[aria-label="${space}"]`); // assert invite received
}
