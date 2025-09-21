import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { ArrowLeft, Users, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const JoinTontine: React.FC = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tontineInfo, setTontineInfo] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // Vérifier si un code est passé en paramètre d'URL
    const urlParams = new URLSearchParams(location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      setCode(codeFromUrl);
      handleSearchTontine(codeFromUrl);
    }
  }, [location]);

  const handleSearchTontine = async (searchCode: string = code) => {
    if (!searchCode.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }

    setLoading(true);
    try {
      // Rechercher la tontine par code d'invitation
      const tontinesQuery = query(
        collection(db, 'tontines'),
        where('codeInvitation', '==', searchCode.toUpperCase())
      );
      const tontinesSnapshot = await getDocs(tontinesQuery);

      if (tontinesSnapshot.empty) {
        toast.error('Aucune tontine trouvée avec ce code');
        setTontineInfo(null);
        return;
      }

      const tontineDoc = tontinesSnapshot.docs[0];
      const tontineData = {
        ...tontineDoc.data(),
        tontineId: tontineDoc.id,
        dateCreation: tontineDoc.data().dateCreation?.toDate(),
        dateDebut: tontineDoc.data().dateDebut?.toDate(),
        dateFin: tontineDoc.data().dateFin?.toDate(),
      };

      // Vérifier si l'utilisateur est déjà participant
      const participantDoc = await getDoc(
        doc(db, 'tontines', tontineDoc.id, 'participants', userProfile?.uid || '')
      );

      if (participantDoc.exists()) {
        toast.info('Vous participez déjà à cette tontine');
        setJoined(true);
      }

      setTontineInfo(tontineData);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche de la tontine');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tontineInfo || !userProfile) return;

    setLoading(true);

    try {
      // Vérifier à nouveau si pas déjà participant
      const participantDoc = await getDoc(
        doc(db, 'tontines', tontineInfo.tontineId, 'participants', userProfile.uid)
      );

      if (participantDoc.exists()) {
        toast.info('Vous participez déjà à cette tontine');
        setJoined(true);
        return;
      }

      // Ajouter le participant
      await addDoc(collection(db, 'tontines', tontineInfo.tontineId, 'participants'), {
        uid: userProfile.uid,
        nom: userProfile.nom,
        prenom: userProfile.prenom,
        email: userProfile.email,
        telephone: userProfile.telephone,
        adresse: userProfile.adresse,
        avatarUrl: userProfile.avatarUrl,
        statutPaiement: "non_paye",
        dateDernierPaiement: null,
        positionRamassage: null,
      });

      toast.success('Vous avez rejoint la tontine avec succès !');
      setJoined(true);
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors de l\'inscription : ' + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-[#195885] rounded-lg transition-colors"
            style={{ borderRadius: '10px' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rejoindre une Tontine</h1>
            <p className="text-gray-600">Entrez le code d'invitation pour rejoindre une tontine</p>
          </div>
        </div>

        {!joined ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* Formulaire de recherche */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'invitation
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Entrez le code (ex: ABC123)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                />
                <button
                  type="button"
                  onClick={() => handleSearchTontine()}
                  disabled={loading || !code.trim()}
                  className="px-6 py-3 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Informations de la tontine trouvée */}
            {tontineInfo && (
              <div className="border border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{tontineInfo.nom}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tontineInfo.statut === 'active' ? 'bg-green-100 text-green-800' :
                    tontineInfo.statut === 'suspendue' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {tontineInfo.statut === 'active' ? 'Active' :
                     tontineInfo.statut === 'suspendue' ? 'Suspendue' :
                     'En attente'}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{tontineInfo.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{tontineInfo.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Montant:</span>
                    <span className="ml-2 font-medium">{tontineInfo.montantCotisation?.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fréquence:</span>
                    <span className="ml-2 font-medium capitalize">{tontineInfo.frequence}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Début:</span>
                    <span className="ml-2 font-medium">{tontineInfo.dateDebut?.toLocaleDateString()}</span>
                  </div>
                </div>

                <form onSubmit={handleJoin} className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    style={{ borderRadius: '10px' }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2" size={18} />
                        Rejoindre cette tontine
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Message de succès */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
            <p className="text-gray-600 mb-6">
              Vous avez rejoint la tontine "{tontineInfo?.nom}" avec succès.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => navigate('/tontines')}
                className="bg-[#195885] text-white px-6 py-3 rounded-lg hover:bg-[#144a6b] transition-colors"
                style={{ borderRadius: '10px' }}
              >
                Voir mes tontines
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ borderRadius: '10px' }}
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinTontine;