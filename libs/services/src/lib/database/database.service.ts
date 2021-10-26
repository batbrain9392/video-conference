import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionChanges,
  doc,
  docSnapshots,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

export type SessionDescription = Pick<
  RTCSessionDescriptionInit,
  'sdp' | 'type'
>;
export type SubCollection = `${'answer' | 'offer'}Candidates`;

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private readonly calls = collection(this.firestore, 'calls');

  constructor(private readonly firestore: Firestore) {}

  createCall() {
    return doc(this.calls).id;
  }

  async getCallOffer(callId: string) {
    const data = (await getDoc(this.getCallRef(callId))).data();
    if (!data) throw new Error('Call not found');
    return data.offer as SessionDescription;
  }

  setCallWithOffer(callId: string, offer: SessionDescription) {
    return setDoc(this.getCallRef(callId), { offer });
  }

  updateCallWithAnswer(callId: string, answer: SessionDescription) {
    return updateDoc(this.getCallRef(callId), { answer });
  }

  listenForRemoteAnswer(callId: string) {
    return (fn: (answer: SessionDescription) => void) =>
      docSnapshots(this.getCallRef(callId)).pipe(
        map((snapshot) => {
          const data = snapshot.data();
          if (!data) throw new Error('Call not found');
          fn(data.answer);
        })
      );
  }

  addCandidate(
    callId: string,
    subCollection: SubCollection,
    candidateData: RTCIceCandidateInit
  ) {
    return addDoc(
      collection(this.getCallRef(callId), subCollection),
      candidateData
    );
  }

  candidateAdded(subCollection: SubCollection, callId: string) {
    return (fn: (data: RTCIceCandidateInit) => void) =>
      collectionChanges(
        collection(this.getCallRef(callId), subCollection)
      ).pipe(
        map((changes) =>
          changes
            .filter(({ type }) => type === 'added')
            .forEach(({ doc }) => fn(doc.data()))
        )
      );
  }

  private getCallRef(callId: string) {
    return doc(this.calls, callId);
  }
}
