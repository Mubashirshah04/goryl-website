// Quick script to set admin role
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyByhCgo_k9i8_AstSaZkZ3Atv5Rt2eOjhc",
  authDomain: "zaillisy.firebaseapp.com",
  databaseURL: "https://zaillisy-default-rtdb.firebaseio.com",
  projectId: "zaillisy",
  storageBucket: "zaillisy.firebasestorage.app",
  messagingSenderId: "984913226421",
  appId: "1:984913226421:web:c648bbccdd5055cf6cecfc",
  measurementId: "G-95WJ280TC9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAllUsersAsAdmin() {
  try {
    console.log('🔍 Setting all users as admin...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      console.log(`✅ Set ${userDoc.id} as admin`);
    }
    
    console.log('✨ All users are now admins!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setAllUsersAsAdmin();
