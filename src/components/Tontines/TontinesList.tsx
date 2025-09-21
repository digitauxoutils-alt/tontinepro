import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Clock, 
  DollarSign, 
  Eye,
  Play,
  Pause,
  Share2,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tontine } from '../../types';
import toast from 'react-hot-toast';

const TontinesList: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'suspendue' | 'terminee'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchTontines();
    }
  }, [userProfile]);

  const fetchTontines = async () => {
    if (!userProfile) return;

    try {
      let tontinesData: Tontine[] = [];

      if (userProfile.role === 'initiatrice') {
        // Récupérer les tontines créées par l'initiatrice
        const q = query(
          collection(db, 'tontines'),
          where('initiatriceId', '==', userProfile.uid),
          orderBy('dateCreation', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        tontinesData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          tontineId: doc.id,
          dateCreation: doc.data().dateCreation?.toDate(),
          dateDebut: doc.data().dateDebut?.toDate(),
          dateFin: doc.data().dateFin?.toDate(),
        })) as Tontine[];
      } else {
        // Pour les participants, récupérer toutes les tontines où ils participent
        const allTontinesQuery = query(collection(db, 'tontines'));
        const allTontinesSnapshot = await getDocs(allTontinesQuery);
        
        for (const tontineDoc of allTontinesSnapshot.docs) {
          const participantsQuery = query(
            collection(db, 'tontines', tontineDoc.id, 'participants'),
            where('uid', '==', userProfile.uid)
          );
          const participantsSnapshot = await getDocs(participantsQuery);
          
          if (!participantsSnapshot.empty) {
            const tontineData = {
              ...tontineDoc.data(),
              tontineId: tontineDoc.id,
              dateCreation: tontineDoc.data().dateCreation?.toDate(),
              dateDebut: tontineDoc.data().dateDebut?.toDate(),
              dateFin: tontineDoc.data().dateFin?.toDate(),
            } as Tontine;
            tontinesData.push(tontineData);
          }
        }
      }

      setTontines(tontinesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des tontines:', error);
      toast.error('Erreur lors du chargement des tontines');
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

  const shareInvitation = async (tontine: Tontine) => {
    const invitationText = `Rejoignez ma tontine "${tontine.nom}" sur TontinePro!\n\nCode: ${tontine.codeInvitation}\nLien: ${tontine.lienInvitation}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invitation - ${tontine.nom}`,
          text: invitationText,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      navigator.clipboard.writeText(invitationText);
      toast.success('Invitation copiée dans le presse-papiers!');
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
      case 'active': return 'Active';
      case 'suspendue': return 'Suspendue';
      case 'en_attente': return 'En attente';
      case 'terminee': return 'Terminée';
      default: return statut;
    }
  };

  const filteredTontines = tontines.filter(tontine => {
    const matchesFilter = filter === 'all' || tontine.statut === filter;
    const matchesSearch = tontine.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tontine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userProfile?.role === 'initiatrice' ? 'Mes Tontines' : 'Mes Participations'}
            </h1>
            <p className="text-gray-600">
              {userProfile?.role === 'initiatrice' 
                ? 'Gérez vos tontines créées' 
                : 'Suivez vos participations aux tontines'
              }
            </p>
          </div>
          {userProfile?.role === 'initiatrice' && (
            <button
              onClick={() => navigate('/tontines/create')}
              className="bg-[#195885] text-white px-6 py-3 rounded-lg hover:bg-[#144a6b] transition-colors flex items-center"
              style={{ borderRadius: '10px' }}
            >
              <Plus className="mr-2" size={20} />
              Créer une Tontine
            </button>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="text-gray-400" size={20} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent"
                style={{ borderRadius: '10px' }}
              >
                <option value="all">Toutes</option>
                <option value="active">Actives</option>
                <option value="suspendue">Suspendues</option>
                <option value="terminee">Terminées</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher une tontine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent w-full md:w-80"
                style={{ borderRadius: '10px' }}
              />
            </div>
          </div>
        </div>

        {/* Liste des tontines */}
        {filteredTontines.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Aucune tontine trouvée' : 'Aucune tontine'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userProfile?.role === 'initiatrice' 
                ? 'Créez votre première tontine pour commencer'
                : 'Rejoignez une tontine pour commencer'
              }
            </p>
            {userProfile?.role === 'initiatrice' ? (
              <button
                onClick={() => navigate('/tontines/create')}
                className="bg-[#195885] text-white px-6 py-3 rounded-lg hover:bg-[#144a6b] transition-colors"
                style={{ borderRadius: '10px' }}
              >
                Créer ma première tontine
              </button>
            ) : (
              <button
                onClick={() => navigate('/join')}
                className="bg-[#195885] text-white px-6 py-3 rounded-lg hover:bg-[#144a6b] transition-colors"
                style={{ borderRadius: '10px' }}
              >
                Rejoindre une tontine
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTontines.map((tontine) => (
              <div key={tontine.tontineId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">
                      {tontine.nom}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tontine.statut)}`}>
                      {getStatusText(tontine.statut)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tontine.description || 'Aucune description'}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{tontine.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-medium">{tontine.montantCotisation?.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fréquence:</span>
                      <span className="font-medium capitalize">{tontine.frequence}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Participants:</span>
                      <span className="font-medium">{tontine.ordreRamassage?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Début:</span>
                      <span className="font-medium">{tontine.dateDebut?.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/tontines/${tontine.tontineId}`)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      style={{ borderRadius: '10px' }}
                    >
                      <Eye size={16} />
                      <span>Voir</span>
                    </button>
                    
                    {userProfile?.role === 'initiatrice' && (
                      <>
                        {(tontine.statut === 'active' || tontine.statut === 'suspendue') && (
                          <button
                            onClick={() => handleToggleTontineStatus(tontine.tontineId, tontine.statut)}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                              tontine.statut === 'active' 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            style={{ borderRadius: '10px' }}
                          >
                            {tontine.statut === 'active' ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                        )}
                        
                        <button
                          onClick={() => shareInvitation(tontine)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          style={{ borderRadius: '10px' }}
                        >
                          <Share2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TontinesList;