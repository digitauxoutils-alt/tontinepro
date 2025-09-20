import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Play,
  Pause,
  Eye,
  Share2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tontine, Paiement } from '../../types';
import toast from 'react-hot-toast';

const InitiatriceDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [paiementsEnAttente, setPaiementsEnAttente] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchTontines();
      fetchPaiementsEnAttente();
    }
  }, [userProfile]);

  const fetchTontines = async () => {
    if (!userProfile) return;

    try {
      const q = query(
        collection(db, 'tontines'),
        where('initiatriceId', '==', userProfile.uid),
        orderBy('dateCreation', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tontinesData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        tontineId: doc.id,
        dateCreation: doc.data().dateCreation?.toDate(),
        dateDebut: doc.data().dateDebut?.toDate(),
        dateFin: doc.data().dateFin?.toDate(),
        trancheRamassageDebut: doc.data().trancheRamassageDebut?.toDate(),
        trancheRamassageFin: doc.data().trancheRamassageFin?.toDate(),
      })) as Tontine[];
      
      setTontines(tontinesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des tontines:', error);
      toast.error('Erreur lors du chargement des tontines');
    }
  };

  const fetchPaiementsEnAttente = async () => {
    if (!userProfile) return;

    try {
      const paiements: Paiement[] = [];
      
      for (const tontine of tontines) {
        const q = query(
          collection(db, 'tontines', tontine.tontineId, 'paiements'),
          where('statut', '==', 'en_attente'),
          orderBy('datePaiement', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const tontinePaiements = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          paiementId: doc.id,
          datePaiement: doc.data().datePaiement?.toDate(),
          dateValidation: doc.data().dateValidation?.toDate(),
        })) as Paiement[];
        
        paiements.push(...tontinePaiements);
      }
      
      setPaiementsEnAttente(paiements);
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTontineStatus = async (tontineId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspendue' : 'active';
      
      await updateDoc(doc(db, 'tontines', tontineId), {
        statut: newStatus
      });
      
      toast.success(`Tontine ${newStatus === 'active' ? 'réactivée' : 'suspendue'} avec succès`);
      fetchTontines();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast.error('Erreur lors de la modification du statut');
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

  const tontinesActives = tontines.filter(t => t.statut === 'active');
  const prochainRamassage = tontinesActives.length > 0 ? tontinesActives[0] : null;

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
            Gérez vos tontines et suivez les paiements de vos participants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tontines Actives</p>
                <p className="text-3xl font-bold text-[#195885]">{tontinesActives.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Prochains Ramassages</p>
                <p className="text-3xl font-bold text-green-600">
                  {prochainRamassage ? '1' : '0'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/tontines/create')}
              className="flex flex-col items-center p-4 bg-[#195885] text-white rounded-xl hover:bg-[#144a6b] transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Plus size={24} className="mb-2" />
              <span className="text-sm font-medium">Créer Tontine</span>
            </button>
            
            <button
              onClick={() => navigate('/tontines')}
              className="flex flex-col items-center p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Users size={24} className="mb-2" />
              <span className="text-sm font-medium">Mes Tontines</span>
            </button>
            
            <button
              onClick={() => navigate('/paiements')}
              className="flex flex-col items-center p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Clock size={24} className="mb-2" />
              <span className="text-sm font-medium">Validations</span>
            </button>
            
            <button
              onClick={() => navigate('/invitations')}
              className="flex flex-col items-center p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              <Share2 size={24} className="mb-2" />
              <span className="text-sm font-medium">Invitations</span>
            </button>
          </div>
        </div>

        {/* Tontines récentes */}
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
                <p className="text-gray-600 mb-4">Aucune tontine créée</p>
                <button
                  onClick={() => navigate('/tontines/create')}
                  className="bg-[#195885] text-white px-6 py-2 rounded-lg hover:bg-[#144a6b] transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  Créer ma première tontine
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
                      <span>Montant: {tontine.montantCotisation.toLocaleString()} FCFA</span>
                      <span>Participants: {tontine.ordreRamassage.length}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/tontines/${tontine.tontineId}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        style={{ borderRadius: '10px' }}
                      >
                        <Eye size={16} />
                        <span>Voir</span>
                      </button>
                      
                      {(tontine.statut === 'active' || tontine.statut === 'suspendue') && (
                        <button
                          onClick={() => handleToggleTontineStatus(tontine.tontineId, tontine.statut)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                            tontine.statut === 'active' 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          style={{ borderRadius: '10px' }}
                        >
                          {tontine.statut === 'active' ? <Pause size={16} /> : <Play size={16} />}
                          <span>{tontine.statut === 'active' ? 'Suspendre' : 'Réactiver'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paiements en attente */}
        {paiementsEnAttente.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <AlertCircle className="text-orange-500 mr-2" size={20} />
                  Paiements à Valider
                </h2>
                <button
                  onClick={() => navigate('/paiements')}
                  className="text-[#195885] hover:text-[#144a6b] font-medium"
                >
                  Voir tout
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {paiementsEnAttente.slice(0, 5).map((paiement) => (
                  <div key={paiement.paiementId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">Paiement en attente</p>
                      <p className="text-sm text-gray-600">
                        Montant: {paiement.montant.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {paiement.datePaiement.toLocaleDateString()}
                      </p>
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        En attente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiatriceDashboard;