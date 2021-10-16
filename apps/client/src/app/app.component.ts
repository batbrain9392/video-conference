import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { PermissionsService } from '@ng-web-apis/permissions';
import { MEDIA_DEVICES } from '@video-conference/ng-web-apis-extended';
// import { combineLatest, from, of } from 'rxjs';
// import { map, shareReplay, switchMap, tap } from 'rxjs/operators';

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

@Component({
  selector: 'video-conference-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // private readonly isCameraNotDenied$ = this.getIsCameraNotDenied();
  // private readonly isMicrophoneNotDenied$ = this.getIsMicrophoneNotDenied();
  // readonly isMediaNotDenied$ = this.getIsMediaNotDenied();
  // readonly localStream$ = this.getLocalStream();
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  callInput = '';
  private readonly pc = new RTCPeerConnection(rtcConfiguration);
  isWebcamButtonDisabled = false;
  isCallButtonDisabled = true;
  isAnswerButtonDisabled = true;
  isHangupButtonDisabled = true;

  constructor(
    // private readonly permissions: PermissionsService,
    @Inject(MEDIA_DEVICES) private readonly mediaDevices: MediaDevices,
    private readonly firestore: Firestore
  ) {}

  async setupMediaSources() {
    const localStream = await this.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    this.localStream = localStream;
    const remoteStream = new MediaStream();
    this.remoteStream = remoteStream;

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    this.isCallButtonDisabled = false;
    this.isAnswerButtonDisabled = false;
    this.isWebcamButtonDisabled = true;
  }

  async createOffer() {
    // Reference Firestore collections for signaling
    const callDoc = doc(collection(this.firestore, 'calls'));
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    this.callInput = callDoc.id;

    // Get candidates for caller, save to db
    this.pc.onicecandidate = (event) => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { offer });

    // Listen for remote answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!this.pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.pc.addIceCandidate(candidate);
        }
      });
    });

    this.isHangupButtonDisabled = false;
  }

  async answerCallWithId(callId: string) {
    const callDoc = doc(collection(this.firestore, 'calls'), callId);
    const answerCandidates = collection(callDoc, 'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');

    this.pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    };

    const callData = (await getDoc(callDoc)).data();

    const offerDescription = callData?.offer;
    await this.pc.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answerDescription);

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
          this.pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  // private getIsCameraNotDenied() {
  //   return this.permissions
  //     .state('camera')
  //     .pipe(map((state) => state !== 'denied'));
  // }

  // private getIsMicrophoneNotDenied() {
  //   return this.permissions
  //     .state('microphone')
  //     .pipe(map((state) => state !== 'denied'));
  // }

  // private getIsMediaNotDenied() {
  //   return combineLatest([
  //     this.isCameraNotDenied$,
  //     this.isMicrophoneNotDenied$,
  //   ]).pipe(
  //     map((states) => !states.includes(false)),
  //     shareReplay(1)
  //   );
  // }

  // private getLocalStream() {
  //   return this.isMediaNotDenied$.pipe(
  //     switchMap((isCameraNotDenied) =>
  //       isCameraNotDenied
  //         ? from(this.mediaDevices.getUserMedia({ video: true, audio: true }))
  //         : of(null)
  //     ),
  //     tap((stream) => this.addStream(stream))
  //   );
  // }

  // addStream(stream: MediaStream | null) {
  //   stream
  //     ?.getTracks()
  //     .forEach((track) => this.rtcPeerConnection.addTrack(track, stream));
  // }

  // async createCall(): Promise<void> {
  //   // this.callInput = await this.webRTC.createOffer();
  // }
}
