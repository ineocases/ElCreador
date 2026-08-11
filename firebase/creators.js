import {

collection,
addDoc,
getDocs,
doc,
deleteDoc,
updateDoc,
getDoc

} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { db } from "./firebase.js";

const creators = collection(db,"creators");

export async function getCreators(){

    const snapshot = await getDocs(creators);

    return snapshot.docs.map(d=>({

        id:d.id,

        ...d.data()

    }));

}

export async function getCreator(id){

    const snap = await getDoc(doc(db,"creators",id));

    return {

        id:snap.id,

        ...snap.data()

    };

}

export async function createCreator(data){

    return await addDoc(creators,data);

}

export async function updateCreator(id,data){

    return await updateDoc(

        doc(db,"creators",id),

        data

    );

}

export async function deleteCreator(id){

    return await deleteDoc(

        doc(db,"creators",id)

    );

}
