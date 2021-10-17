import { Component } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  onSnapshot,
  updateDoc,
} from '@angular/fire/firestore';
import { MediaService, WebRTCService } from '@video-conference/services';

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly localStream$ = this.media.localStream$;
  readonly remoteStream$ = this.webRTC.remoteStream$;
  meetingId = '';

  constructor(
    private readonly media: MediaService,
    private readonly firestore: Firestore,
    private readonly webRTC: WebRTCService
  ) {}

  async createMeeting(): Promise<void> {
    this.meetingId = await this.webRTC.createOffer();
  }

  async joinMeeting(callId: string) {
    const callDoc = doc(collection(this.firestore, 'calls'), callId);
    const answerCandidates = collection(callDoc, 'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');

    this.webRTC.rtcPeerConnection.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDoc)).data();

    const offerDescription = callData?.offer;
    await this.webRTC.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    const answerDescription =
      await this.webRTC.rtcPeerConnection.createAnswer();
    await this.webRTC.rtcPeerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === 'added') {
          const data = change.doc.data();
          this.webRTC.rtcPeerConnection.addIceCandidate(
            new RTCIceCandidate(data)
          );
        }
      });
    });
  }
}
