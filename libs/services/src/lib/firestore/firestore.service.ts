import { Injectable } from '@angular/core';
// import {
//   Firestore,
//   collection,
//   doc,
//   DocumentData,
//   DocumentReference,
//   addDoc,
//   onSnapshot,
// } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  // private readonly calls = collection(this.firestore, 'calls');
  // constructor(private readonly firestore: Firestore) {}
  // createCall(
  //   offer: RTCSessionDescriptionInit
  // ): Promise<DocumentReference<DocumentData>> {
  //   return addDoc(this.calls, offer);
  // }
  // getCall(callId: string): DocumentReference<DocumentData> {
  //   return doc(this.calls, callId);
  // }
  // addOfferCandidate(
  //   offerCandidate: RTCIceCandidateInit,
  //   call: DocumentReference<DocumentData>
  // ) {
  //   const offerCandidates = collection(call, 'offerCandidates');
  //   return addDoc(offerCandidates, offerCandidate);
  // }
  // listenForRemoteAnswer(call: DocumentReference<DocumentData>) {
  //   onSnapshot(call, ({ data }) => {
  //     if (!pc.currentRemoteDescription && data?.answer) {
  //       const answerDescription = new RTCSessionDescription(data.answer);
  //       pc.setRemoteDescription(answerDescription);
  //     }
  //   });
  // }
}
