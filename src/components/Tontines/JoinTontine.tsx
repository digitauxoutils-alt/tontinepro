// src/components/Tontines/JoinTontine.tsx
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FirestoreService } from "../../hooks/useFirestore";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function JoinTontine() {
  const { currentUser } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 Fonction pour rejoindre une tontine
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Vérifier si la tontine existe
      const tontineRef = doc(db, "tontines", code);
      const tontineSnap = await getDoc(tontineRef);

      if (!tontineSnap.exists()) {
        setMessage("❌ Tontine introuvable avec ce code !");
        setLoading(false);
        return;
      }

      // Ajouter le participant dans la sous-collection
      await addDoc(collection(tontineRef, "participants"), {
        uid: currentUser?.uid,
        nom: currentUser?.displayName || "",
        email: currentUser?.email || "",
        statutPaiement: "non_paye",
        dateDernierPaiement: null,
        positionRamassage: null,
      });

      setMessage("✅ Vous avez rejoint la tontine avec succès !");
      setCode("");
    } catch (error: any) {
      console.error(error);
      setMessage("❌ Erreur lors de l’inscription : " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-xl font-bold text-center text-[#195885] mb-4">
        Rejoindre une Tontine
      </h2>

      <form onSubmit={handleJoin} className="space-y-4">
        <input
          type="text"
          placeholder="Entrez le code de la tontine"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#195885]"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#195885] text-white py-2 rounded-lg hover:bg-[#15476a]"
        >
          {loading ? "Chargement..." : "Rejoindre"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
