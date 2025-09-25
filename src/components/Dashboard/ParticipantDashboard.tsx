import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  UserPlus,
  Bell
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tontine, Participant, Paiement } from '../../types';
import toast from 'react-hot-toast';

const ParticipantDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [mesPaiements, setMesPaiements] = useState<Paiement[]>([]);
  const [prochainsPaiements, setProchainsPaiements] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchMesTontines();
    }
  }, [userProfile]);

  const fetchMesTontines = async () => {
    if (!userProfile) return;

    try {
      // Récupérer toutes les tontines
      const tontinesQuery = query(collection(db, 'tontines'));
      const tontinesSnapshot = await getDocs(tontinesQuery);
      
      const participantTontines: Tontine[] = [];
      const paiements: Paiement[] = [];

      for (const tontineDoc of tontinesSnapshot.docs) {
        const tontineData = {
          ...tontineDoc.data(),
          tontineId: tontineDoc.id,
          dateCreation: tontineDoc.data().dateCreation?.toDate(),
          dateDebut: tontineDoc.data().dateDebut?.toDate(),
          dateFin: tontineDoc.data().dateFin?.toDate(),
          trancheRamassageDebut: tontineDoc.data().trancheRamassageDebut?.toDate(),
          trancheRamassageFin: tontineDoc.data().trancheRamassageFin?.toDate(),
        } as Tontine;

        // Vérifier si l'utilisateur est participant
        const participantsQuery = query(
          collection(db, 'tontines', tontineDoc.id, 'participants'),
          where('uid', '==', userProfile.uid)
        );
        const participantsSnapshot = await getDocs(participantsQuery);

        if (!participantsSnapshot.empty) {
          participantTontines.push(tontineData);

          // Récupérer les paiements de ce participant pour cette tontine
          const paiementsQuery = query(
            collection(db, 'tontines', tontineDoc.id, 'paiements'),
            where('participantId', '==', userProfile.uid),
            orderBy('datePaiement', 'desc')
          );
          
          const paiementsSnapshot = await getDocs(paiementsQuery);
          const tontinePaiements = paiementsSnapshot.docs.map(doc => ({
            ...doc.data(),
            paiementId: doc.id,
            tontineId: tontineDoc.id,
            tontineNom: tontineData.nom,
            datePaiement: doc.data().datePaiement?.toDate(),
            dateValidation: doc.data().dateValidation?.toDate(),
          })) as Paiement[];
          
          paiements.push(...tontinePaiements);
        }
      }

      setTontines(participantTontines);
      setMesPaiements(paiements);
      
      // Identifier les tontines nécessitant un paiement
      const tontinesActives = participantTontines.filter(t => t.statut === 'active');
      setProchainsPaiements(tontinesActives.slice(0, 3));
      
    } catch (error) {
      console.error('Erreur lors de la récupération des tontines:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspendue': return 'bg-yellow-100 text-yellow-800';
      case 'en_attente': return 'bg-blue-100 text-blue-800';
      case 'terminee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'active': return 'Tontine active';
      case 'suspendue': return 'Tontine suspendue';
      case 'en_attente': return 'En attente';
      case 'terminee': return 'Terminée';
      default: return statut;
    }
  };

  const getPaiementStatusColor = (statut: string) => {
    switch (statut) {
      case 'valide': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaiementStatusText = (statut: string) => {
    switch (statut) {
      case 'valide': return 'Payé confirmé';
      case 'en_attente': return 'En attente';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  };

  const tontinesActives = tontines.filter(t => t.statut === 'active');
  const paiementsEnAttente = mesPaiements.filter(p => p.statut === 'en_attente');
  const paiementsValides = mesPaiements.filter(p => p.statut === 'confirme');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#195885]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour, {userProfile?.prenom} ! 👋
          </h1>
          <p className="text-gray-600">
            Suivez vos tontines et gérez vos paiements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mes Tontines</p>
                <p className="text-3xl font-bold text-[#195885]">{tontines.length}</p>
              </div>
              <div className="p-3 bg-[#195885] bg-opacity-10 rounded-xl">
                <Users className="text-[#195885]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paiements en Attente</p>
                <p className="text-3xl font-bold text-orange-600">{paiementsEnAttente.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paiements Validés</p>
                <p className="text-3xl font-bold text-green-600">{paiementsValides.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/tontines')}
              className="flex flex-col items-center p-4 bg-[#195885] text-white rounded-xl hover:bg-[#144a6b] transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Users size={24} className="mb-2" />
              <span className="text-sm font-medium">Mes Tontines</span>
            </button>
            
            <button
              onClick={() => navigate('/paiements')}
              className="flex flex-col items-center p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <CreditCard size={24} className="mb-2" />
              <span className="text-sm font-medium">Payer</span>
            </button>
            
            <button
              onClick={() => navigate('/join')}
              className="flex flex-col items-center p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <UserPlus size={24} className="mb-2" />
              <span className="text-sm font-medium">Rejoindre</span>
            </button>
            
            <button
              onClick={() => navigate('/profil')}
              className="flex flex-col items-center p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Bell size={24} className="mb-2" />
              <span className="text-sm font-medium">Profil</span>
            </button>
          </div>
        </div>

        {/* Mes Tontines */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Mes Tontines</h2>
              <button
                onClick={() => navigate('/tontines')}
                className="text-[#195885] hover:text-[#144a6b] font-medium"
              >
                Voir tout
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {tontines.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-4">Vous ne participez à aucune tontine</p>
                <button
                  onClick={() => navigate('/join')}
                  className="bg-[#195885] text-white px-6 py-2 rounded-lg hover:bg-[#144a6b] transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  Rejoindre une tontine
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tontines.slice(0, 3).map((tontine) => (
                  <div key={tontine.tontineId} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{tontine.nom}</h3>
                        <p className="text-sm text-gray-600">{tontine.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tontine.statut)}`}>
                        {getStatusText(tontine.statut)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>Type: {tontine.type}</span>
                      <span>Montant: {tontine.montantCotisation?.toLocaleString()} FCFA</span>
                      <span>Fréquence: {tontine.frequence}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/tontines/${tontine.tontineId}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors"
                        style={{ borderRadius: '10px' }}
                      >
                        <span>Voir détails</span>
                      </button>
                      
                      {tontine.statut === 'active' && (
                        <button
                          onClick={() => navigate('/paiements')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          style={{ borderRadius: '10px' }}
                        >
                          <CreditCard size={16} />
                          <span>Payer</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paiements récents */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Mes Paiements Récents</h2>
              <button
                onClick={() => navigate('/paiements')}
                className="text-[#195885] hover:text-[#144a6b] font-medium"
              >
                Voir tout
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {mesPaiements.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Aucun paiement effectué</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mesPaiements.slice(0, 5).map((paiement) => (
                  <div key={paiement.paiementId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        {paiement.tontineNom} - {paiement.periode || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Montant: {paiement.montant.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {paiement.datePaiement.toLocaleDateString()}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaiementStatusColor(paiement.statut)}`}>
                        {getPaiementStatusText(paiement.statut)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications/Rappels */}
        {(paiementsEnAttente.length > 0 || prochainsPaiements.length > 0) && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-orange-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-orange-800">Notifications</h3>
            </div>
            
            {paiementsEnAttente.length > 0 && (
              <div className="mb-4">
                <p className="text-orange-700 mb-2">
                  ⏳ {paiementsEnAttente.length} paiement(s) en attente de validation
                </p>
              </div>
            )}
            
            {prochainsPaiements.length > 0 && (
              <div className="mb-4">
                <p className="text-orange-700 mb-2">
                  💰 {prochainsPaiements.length} tontine(s) active(s) nécessitent votre attention
                </p>
              </div>
            )}
            
            <button
              onClick={() => navigate('/paiements')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              Gérer mes paiements
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantDashboard;