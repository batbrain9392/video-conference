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
  collectionChanges,
  docSnapshots,
  Firestore,
} from '@angular/fire/firestore';
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  setDoc,
  updateDoc,
} from '@firebase/firestore';
// import { FirestoreService } from '../firestore/firestore.service';

type SessionDescription = Pick<RTCSessionDescriptionInit, 'sdp' | 'type'>;
type SubCollection = `${'answer' | 'offer'}Candidates`;
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

  constructor(private readonly firestore: Firestore) {}

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
    const callDoc = doc(collection(this.firestore, 'calls'));
    return merge(
      this.getCandidatesAndSaveToDb('offerCandidates', callDoc),
      from(this.createOffer(callDoc)).pipe(
        switchMap(() =>
          merge(
            this.listenForRemoteAnswer(callDoc),
            this.addCandidateToPeerConnectionWhenAnswered(
              'answerCandidates',
              callDoc
            )
          )
        )
      )
    ).pipe(
      map(() => callDoc.id),
      startWith(callDoc.id),
      distinctUntilChanged()
    );
  }

  private async createOffer(
    callDoc: DocumentReference<DocumentData>
  ): Promise<void> {
    const offerDescription = await this.rtcPeerConnection.createOffer();
    await this.rtcPeerConnection.setLocalDescription(offerDescription);
    const offer = this.getSessionDescription(offerDescription);
    return setDoc(callDoc, { offer });
  }

  private listenForRemoteAnswer(
    callDoc: DocumentReference<DocumentData>
  ): Observable<void> {
    return docSnapshots(callDoc).pipe(
      map((snapshot) => {
        const data = snapshot.data();
        if (!this.rtcPeerConnection.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          this.rtcPeerConnection.setRemoteDescription(answerDescription);
        }
      })
    );
  }

  joinCall(callId: string): Observable<void> {
    const callDoc = doc(collection(this.firestore, 'calls'), callId);
    return merge(
      this.getCandidatesAndSaveToDb('answerCandidates', callDoc),
      from(this.createAnswer(callDoc)).pipe(
        switchMap(() =>
          this.addCandidateToPeerConnectionWhenAnswered(
            'offerCandidates',
            callDoc
          )
        )
      )
    );
  }

  private async createAnswer(
    callDoc: DocumentReference<DocumentData>
  ): Promise<void> {
    const offer: SessionDescription = (await getDoc(callDoc)).data()?.offer;
    await this.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answerDescription = await this.rtcPeerConnection.createAnswer();
    await this.rtcPeerConnection.setLocalDescription(answerDescription);
    const answer = this.getSessionDescription(answerDescription);
    return updateDoc(callDoc, { answer });
  }

  private getSessionDescription({
    type,
    sdp,
  }: RTCSessionDescriptionInit): SessionDescription {
    return { type, sdp };
  }

  private getCandidatesAndSaveToDb(
    subCollection: SubCollection,
    callDoc: DocumentReference<DocumentData>
  ): Observable<void> {
    return fromEvent<RTCPeerConnectionIceEvent>(
      this.rtcPeerConnection,
      'icecandidate'
    ).pipe(
      switchMap(({ candidate }) =>
        candidate
          ? addDoc(collection(callDoc, subCollection), candidate.toJSON())
          : EMPTY
      ),
      map(() => {
        return;
      })
    );
  }

  private addCandidateToPeerConnectionWhenAnswered(
    subCollection: SubCollection,
    callDoc: DocumentReference<DocumentData>
  ): Observable<void> {
    return collectionChanges(collection(callDoc, subCollection)).pipe(
      map((changes) =>
        changes
          .filter(({ type }) => type === 'added')
          .forEach(({ doc }) =>
            this.rtcPeerConnection.addIceCandidate(
              new RTCIceCandidate(doc.data())
            )
          )
      )
    );
  }
}
