/*
Copyright 2018 Lepton Interaction.

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

// Find a protocol 'instance' with a given instance_id
// in the supplied protocols dict
export function instanceForInstanceId(protocols, instanceId) {
    if (!instanceId) return null;
    for (const proto of Object.keys(protocols)) {
        if (!protocols[proto].instances && protocols[proto].instances instanceof Array) continue;
        for (const instance of protocols[proto].instances) {
            if (instance.instance_id == instanceId) return instance;
        }
    }
}

// given an instance_id, return the name of the protocol for
// that instance ID in the supplied protocols dict
export function protocolNameForInstanceId(protocols, instanceId) {
    if (!instanceId) return null;
    for (const proto of Object.keys(protocols)) {
        if (!protocols[proto].instances && protocols[proto].instances instanceof Array) continue;
        for (const instance of protocols[proto].instances) {
            if (instance.instance_id == instanceId) return proto;
        }
    }
}
