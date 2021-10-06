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

import { MatrixClient } from "matrix-js-sdk/src/client";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { Room } from "matrix-js-sdk/src/models/room";
import { Playback, PlaybackState } from "./Playback";
import { UPDATE_EVENT } from "../stores/AsyncStore";
import { MatrixClientPeg } from "../MatrixClientPeg";
import { arrayFastClone } from "../utils/arrays";
import { PlaybackManager } from "./PlaybackManager";
import { isVoiceMessage } from "../utils/EventUtils";
import RoomViewStore from "../stores/RoomViewStore";
import { EventType } from "matrix-js-sdk/src/@types/event";

/**
 * Audio playback queue management for a given room. This keeps track of where the user
 * was at for each playback, what order the playbacks were played in, and triggers subsequent
 * playbacks.
 *
 * Currently this is only intended to be used by voice messages.
 *
 * The primary mechanics are:
 * * Persisted clock state for each playback instance (tied to Event ID).
 * * Limited memory of playback order (see code; not persisted).
 * * Autoplay of next eligible playback instance.
 */
export class PlaybackQueue {
    private static queues = new Map<string, PlaybackQueue>(); // keyed by room ID

    private playbacks = new Map<string, Playback>(); // keyed by event ID
    private clockStates = new Map<string, number>(); // keyed by event ID
    private playbackIdOrder: string[] = []; // event IDs, last == current
    private currentPlaybackId: string; // event ID, broken out from above for ease of use
    private recentFullPlays = new Set<string>(); // event IDs

    constructor(private client: MatrixClient, private room: Room) {
        this.loadClocks();

        RoomViewStore.addListener(() => {
            if (RoomViewStore.getRoomId() === this.room.roomId) {
                // Reset the state of the playbacks before they start mounting and enqueuing updates.
                // We reset the entirety of the queue, including order, to ensure the user isn't left
                // confused with what order the messages are playing in.
                this.currentPlaybackId = null; // this in particular stops autoplay when the room is switched to
                this.recentFullPlays = new Set<string>();
                this.playbackIdOrder = [];
            }
        });
    }

    public static forRoom(roomId: string): PlaybackQueue {
        const cli = MatrixClientPeg.get();
        const room = cli.getRoom(roomId);
        if (!room) throw new Error("Unknown room");
        if (PlaybackQueue.queues.has(room.roomId)) {
            return PlaybackQueue.queues.get(room.roomId);
        }
        const queue = new PlaybackQueue(cli, room);
        PlaybackQueue.queues.set(room.roomId, queue);
        return queue;
    }

    private persistClocks() {
        localStorage.setItem(
            `mx_voice_message_clocks_${this.room.roomId}`,
            JSON.stringify(Array.from(this.clockStates.entries())),
        );
    }

    private loadClocks() {
        const val = localStorage.getItem(`mx_voice_message_clocks_${this.room.roomId}`);
        if (!!val) {
            this.clockStates = new Map<string, number>(JSON.parse(val));
        }
    }

    public unsortedEnqueue(mxEvent: MatrixEvent, playback: Playback) {
        // We don't ever detach our listeners: we expect the Playback to clean up for us
        this.playbacks.set(mxEvent.getId(), playback);
        playback.on(UPDATE_EVENT, (state) => this.onPlaybackStateChange(playback, mxEvent, state));
        playback.clockInfo.liveData.onUpdate((clock) => this.onPlaybackClock(playback, mxEvent, clock));
    }

    private onPlaybackStateChange(playback: Playback, mxEvent: MatrixEvent, newState: PlaybackState) {
        // Remember where the user got to in playback
        const wasLastPlaying = this.currentPlaybackId === mxEvent.getId();
        if (newState === PlaybackState.Stopped && this.clockStates.has(mxEvent.getId()) && !wasLastPlaying) {
            // noinspection JSIgnoredPromiseFromCall
            playback.skipTo(this.clockStates.get(mxEvent.getId()));
        } else if (newState === PlaybackState.Stopped) {
            // Remove the now-useless clock for some space savings
            this.clockStates.delete(mxEvent.getId());

            if (wasLastPlaying) {
                this.recentFullPlays.add(this.currentPlaybackId);
                const orderClone = arrayFastClone(this.playbackIdOrder);
                const last = orderClone.pop();
                if (last === this.currentPlaybackId) {
                    const next = orderClone.pop();
                    if (next) {
                        const instance = this.playbacks.get(next);
                        if (!instance) {
                            console.warn(
                                "Voice message queue desync: Missing playback for next message: "
                                + `Current=${this.currentPlaybackId} Last=${last} Next=${next}`,
                            );
                        } else {
                            this.playbackIdOrder = orderClone;
                            PlaybackManager.instance.pauseAllExcept(instance);

                            // This should cause a Play event, which will re-populate our playback order
                            // and update our current playback ID.
                            // noinspection JSIgnoredPromiseFromCall
                            instance.play();
                        }
                    } else {
                        // else no explicit next event, so find an event we haven't played that comes next. The live
                        // timeline is already most recent last, so we can iterate down that.
                        const timeline = arrayFastClone(this.room.getLiveTimeline().getEvents());
                        let scanForVoiceMessage = false;
                        let nextEv: MatrixEvent;
                        for (const event of timeline) {
                            if (event.getId() === mxEvent.getId()) {
                                scanForVoiceMessage = true;
                                continue;
                            }
                            if (!scanForVoiceMessage) continue;

                            if (!isVoiceMessage(event)) {
                                const evType = event.getType();
                                if (evType !== EventType.RoomMessage && evType !== EventType.Sticker) {
                                    continue; // Event can be skipped for automatic playback consideration
                                }
                                break; // Stop automatic playback: next useful event is not a voice message
                            }

                            const havePlayback = this.playbacks.has(event.getId());
                            const isRecentlyCompleted = this.recentFullPlays.has(event.getId());
                            if (havePlayback && !isRecentlyCompleted) {
                                nextEv = event;
                                break;
                            }
                        }
                        if (!nextEv) {
                            // if we don't have anywhere to go, reset the recent playback queue so the user
                            // can start a new chain of playbacks.
                            this.recentFullPlays = new Set<string>();
                            this.playbackIdOrder = [];
                        } else {
                            this.playbackIdOrder = orderClone;

                            const instance = this.playbacks.get(nextEv.getId());
                            PlaybackManager.instance.pauseAllExcept(instance);

                            // This should cause a Play event, which will re-populate our playback order
                            // and update our current playback ID.
                            // noinspection JSIgnoredPromiseFromCall
                            instance.play();
                        }
                    }
                } else {
                    console.warn(
                        "Voice message queue desync: Expected playback stop to be last in order. "
                        + `Current=${this.currentPlaybackId} Last=${last} EventID=${mxEvent.getId()}`,
                    );
                }
            }
        }

        if (newState === PlaybackState.Playing) {
            const order = this.playbackIdOrder;
            if (this.currentPlaybackId !== mxEvent.getId() && !!this.currentPlaybackId) {
                if (order.length === 0 || order[order.length - 1] !== this.currentPlaybackId) {
                    const lastInstance = this.playbacks.get(this.currentPlaybackId);
                    if (
                        lastInstance.currentState === PlaybackState.Playing
                        || lastInstance.currentState === PlaybackState.Paused
                    ) {
                        order.push(this.currentPlaybackId);
                    }
                }
            }

            this.currentPlaybackId = mxEvent.getId();
            if (order.length === 0 || order[order.length - 1] !== this.currentPlaybackId) {
                order.push(this.currentPlaybackId);
            }
        }

        // Only persist clock information on pause/stop (end) to avoid overwhelming the storage.
        // This should get triggered from normal voice message component unmount due to the playback
        // stopping itself for cleanup.
        if (newState === PlaybackState.Paused || newState === PlaybackState.Stopped) {
            this.persistClocks();
        }
    }

    private onPlaybackClock(playback: Playback, mxEvent: MatrixEvent, clocks: number[]) {
        if (playback.currentState === PlaybackState.Decoding) return; // ignore pre-ready values

        if (playback.currentState !== PlaybackState.Stopped) {
            this.clockStates.set(mxEvent.getId(), clocks[0]); // [0] is the current seek position
        }
    }
}
