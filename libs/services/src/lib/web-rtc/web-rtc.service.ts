import { Injectable } from '@angular/core';
import { EMPTY, from, fromEvent, merge, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  DatabaseService,
  SessionDescription,
  SubCollection,
} from '../database/database.service';

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

@Injectable({
  providedIn: 'root',
})
export class WebRTCService {
  readonly rtcPeerConnection = new RTCPeerConnection(rtcConfiguration);
  readonly remoteStream$ = this.getRemoteStream();

  constructor(private readonly database: DatabaseService) {}

  private getRemoteStream(): Observable<MediaStream> {
    return fromEvent<RTCTrackEvent>(this.rtcPeerConnection, 'track').pipe(
      map(({ streams: [stream] }) => stream),
      take(1)
    );
  }

  addLocalStreamToWebRTC(stream: MediaStream): void {
    stream
      .getTracks()
      .forEach((track) => this.rtcPeerConnection.addTrack(track, stream));
  }

  createCall(): Observable<string> {
    const callId = this.database.createCall();
    return merge(
      this.getCandidatesAndSaveToDb('offerCandidates', callId),
      from(this.createOffer(callId)).pipe(
        switchMap(() =>
          merge(
            this.listenForRemoteAnswer(callId),
            this.addCandidateToPeerConnectionWhenAnswered(
              'answerCandidates',
              callId
            )
          )
        )
      )
    ).pipe(
      map(() => callId),
      startWith(callId),
      distinctUntilChanged()
    );
  }

  private getCandidatesAndSaveToDb(
    subCollection: SubCollection,
    callId: string
  ): Observable<void> {
    return fromEvent<RTCPeerConnectionIceEvent>(
      this.rtcPeerConnection,
      'icecandidate'
    ).pipe(
      switchMap(({ candidate }) =>
        candidate
          ? this.database.addCandidate(
              callId,
              subCollection,
              candidate.toJSON()
            )
          : EMPTY
      ),
      map(() => {
        return;
      })
    );
  }

  private async createOffer(callId: string): Promise<void> {
    const offerDescription = await this.rtcPeerConnection.createOffer();
    await this.rtcPeerConnection.setLocalDescription(offerDescription);
    const offer = this.getSessionDescription(offerDescription);
    return this.database.setCallWithOffer(callId, offer);
  }

  private getSessionDescription({
    type,
    sdp,
  }: RTCSessionDescriptionInit): SessionDescription {
    return { type, sdp };
  }

  private listenForRemoteAnswer(callId: string): Observable<void> {
    return this.database.listenForRemoteAnswer(callId)(
      (answer: SessionDescription) => {
        if (!this.rtcPeerConnection.currentRemoteDescription && answer) {
          const answerDescription = new RTCSessionDescription(answer);
          this.rtcPeerConnection.setRemoteDescription(answerDescription);
        }
      }
    );
  }

  joinCall(callId: string): Observable<void> {
    return merge(
      this.getCandidatesAndSaveToDb('answerCandidates', callId),
      from(this.createAnswer(callId)).pipe(
        switchMap(() =>
          this.addCandidateToPeerConnectionWhenAnswered(
            'offerCandidates',
            callId
          )
        )
      )
    );
  }

  private async createAnswer(callId: string): Promise<void> {
    const offer = await this.database.getCallOffer(callId);
    await this.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answerDescription = await this.rtcPeerConnection.createAnswer();
    await this.rtcPeerConnection.setLocalDescription(answerDescription);
    const answer = this.getSessionDescription(answerDescription);
    return this.database.updateCallWithAnswer(callId, answer);
  }

  private addCandidateToPeerConnectionWhenAnswered(
    subCollection: SubCollection,
    callId: string
  ): Observable<void> {
    return this.database.candidateAdded(
      subCollection,
      callId
    )((data: RTCIceCandidateInit) =>
      this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(data))
    );
  }
}
