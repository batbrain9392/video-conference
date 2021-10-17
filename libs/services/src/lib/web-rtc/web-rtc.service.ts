import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from '@firebase/firestore';
// import { FirestoreService } from '../firestore/firestore.service';

type SessionDescription = Pick<RTCSessionDescriptionInit, 'sdp' | 'type'>;
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

  async createOffer(): Promise<string> {
    // Create offer
    const offerDescription = await this.rtcPeerConnection.createOffer();
    await this.rtcPeerConnection.setLocalDescription(offerDescription);

    const offer: SessionDescription = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Reference Firestore collections for signaling
    const calls = collection(this.firestore, 'calls');
    const callDoc = await addDoc(calls, { offer });
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    // Get candidates for caller, save to db
    this.rtcPeerConnection.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    // Listen for remote answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!this.rtcPeerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.rtcPeerConnection.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidates, (snapshot) =>
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.rtcPeerConnection.addIceCandidate(candidate);
        }
      })
    );

    return callDoc.id;
  }

  async joinCall(callId: string): Promise<void> {
    const callDoc = doc(collection(this.firestore, 'calls'), callId);
    const answerCandidates = collection(callDoc, 'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');

    this.rtcPeerConnection.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const offer: SessionDescription = (await getDoc(callDoc)).data()?.offer;
    await this.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answerDescription = await this.rtcPeerConnection.createAnswer();
    await this.rtcPeerConnection.setLocalDescription(answerDescription);

    const answer: SessionDescription = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    onSnapshot(offerCandidates, (snapshot) =>
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === 'added') {
          const data = change.doc.data();
          this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      })
    );
  }
}
