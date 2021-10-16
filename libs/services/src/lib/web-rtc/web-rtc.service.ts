import { Injectable } from '@angular/core';
// import { FirestoreService } from '../firestore/firestore.service';

// const rtcConfiguration: RTCConfiguration = {
//   iceServers: [
//     {
//       urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
//     },
//   ],
//   iceCandidatePoolSize: 10,
// };

@Injectable({
  providedIn: 'root',
})
export class WebRTCService {
  // private readonly rtcPeerConnection = new RTCPeerConnection(rtcConfiguration);
  // readonly remoteStream = new MediaStream();
  // constructor(private readonly firestore: FirestoreService) {
  //   this.rtcPeerConnection.ontrack = ({ streams: [stream] }) =>
  //     stream.getTracks().forEach((track) => this.remoteStream.addTrack(track));
  // }
  // addStream(stream: MediaStream | null) {
  //   stream
  //     ?.getTracks()
  //     .forEach((track) => this.rtcPeerConnection.addTrack(track, stream));
  // }
}
