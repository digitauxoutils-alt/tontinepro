import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock,
  Share2,
  Copy,
  UserPlus,
  Play,
  Pause,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tontine, Participant, Paiement } from '../../types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

const TontineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [tontine, setTontine] = useState<Tontine | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTontineDetails();
    }
  }, [id]);

  const fetchTontineDetails = async () => {
    if (!id) return;

    try {
      // Récupérer les détails de la tontine
      const tontineDoc = await getDoc(doc(db, 'tontines', id));
      if (tontineDoc.exists()) {
        const tontineData = {
          ...tontineDoc.data(),
          tontineId: tontineDoc.id,
          dateCreation: tontineDoc.data().dateCreation?.toDate(),
          dateDebut: tontineDoc.data().dateDebut?.toDate(),
          dateFin: tontineDoc.data().dateFin?.toDate(),
        } as Tontine;
        setTontine(tontineData);

        // Récupérer les participants
        const participantsSnapshot = await getDocs(collection(db, 'tontines', id, 'participants'));
        const participantsData = participantsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Participant[];
        setParticipants(participantsData);

        // Récupérer les paiements
        const paiementsQuery = query(
          collection(db, 'tontines', id, 'paiements'),
          orderBy('datePaiement', 'desc')
        );
        const paiementsSnapshot = await getDocs(paiementsQuery);
        const paiementsData = paiementsSnapshot.docs.map(doc => ({
          ...doc.data(),
          paiementId: doc.id,
          datePaiement: doc.data().datePaiement?.toDate(),
          dateValidation: doc.data().dateValidation?.toDate(),
        })) as Paiement[];
        setPaiements(paiementsData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !tontine || userProfile?.role !== 'initiatrice') return;

    const items = Array.from(participants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setParticipants(items);

    try {
      const newOrder = items.map(p => p.uid);
      await updateDoc(doc(db, 'tontines', tontine.tontineId), {
        ordreRamassage: newOrder
      });
      toast.success('Ordre de ramassage mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', error);
      toast.error('Erreur lors de la mise à jour');
      fetchTontineDetails(); // Recharger les données
    }
  };

  const toggleTontineStatus = async () => {
    if (!tontine || userProfile?.role !== 'initiatrice') return;

    try {
      const newStatus = tontine.statut === 'active' ? 'suspendue' : 'active';
      await updateDoc(doc(db, 'tontines', tontine.tontineId), {
        statut: newStatus
      });
      
      setTontine({ ...tontine, statut: newStatus });
      toast.success(`Tontine ${newStatus === 'active' ? 'réactivée' : 'suspendue'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const copyInvitationCode = () => {
    if (tontine?.codeInvitation) {
      navigator.clipboard.writeText(tontine.codeInvitation);
      toast.success('Code d\'invitation copié!');
    }
  };

  const copyInvitationLink = () => {
    if (tontine?.lienInvitation) {
      navigator.clipboard.writeText(tontine.lienInvitation);
      toast.success('Lien d\'invitation copié!');
    }
  };

  const shareInvitation = async () => {
    if (!tontine) return;
    
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

  const getPaiementStatusColor = (statut: string) => {
    switch (statut) {
      case 'confirme': return 'text-green-600';
      case 'en_attente': return 'text-yellow-600';
      case 'refuse': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaiementStatusIcon = (statut: string) => {
    switch (statut) {
      case 'confirme': return <CheckCircle size={16} />;
      case 'en_attente': return <AlertCircle size={16} />;
      case 'refuse': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#195885]"></div>
      </div>
    );
  }

  if (!tontine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tontine non trouvée</h2>
          <button
            onClick={() => navigate('/tontines')}
            className="bg-[#195885] text-white px-6 py-3 rounded-lg hover:bg-[#144a6b] transition-colors"
            style={{ borderRadius: '10px' }}
          >
            Retour aux tontines
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/tontines')}
            className="mr-4 p-2 text-gray-600 hover:text-[#195885] rounded-lg transition-colors"
            style={{ borderRadius: '10px' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{tontine.nom}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tontine.statut)}`}>
                {tontine.statut === 'active' ? 'Active' : 
                 tontine.statut === 'suspendue' ? 'Suspendue' : 
                 tontine.statut === 'terminee' ? 'Terminée' : 'En attente'}
              </span>
            </div>
            <p className="text-gray-600">{tontine.description}</p>
          </div>
          
          {userProfile?.role === 'initiatrice' && tontine.initiatriceId === userProfile.uid && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                style={{ borderRadius: '10px' }}
              >
                <UserPlus className="mr-2" size={18} />
                Inviter
              </button>
              
              {(tontine.statut === 'active' || tontine.statut === 'suspendue') && (
                <button
                  onClick={toggleTontineStatus}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    tontine.statut === 'active' 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  style={{ borderRadius: '10px' }}
                >
                  {tontine.statut === 'active' ? <Pause className="mr-2" size={18} /> : <Play className="mr-2" size={18} />}
                  {tontine.statut === 'active' ? 'Suspendre' : 'Réactiver'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-8">
            {/* Détails de la tontine */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Détails de la Tontine</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#195885] bg-opacity-10 rounded-lg">
                    <DollarSign className="text-[#195885]" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant de cotisation</p>
                    <p className="font-semibold">{tontine.montantCotisation?.toLocaleString()} FCFA</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fréquence</p>
                    <p className="font-semibold capitalize">{tontine.frequence}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participants</p>
                    <p className="font-semibold">{participants.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de début</p>
                    <p className="font-semibold">{tontine.dateDebut?.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants et ordre de ramassage */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Participants & Ordre de Ramassage</h2>
                {userProfile?.role === 'initiatrice' && tontine.initiatriceId === userProfile.uid && (
                  <p className="text-sm text-gray-600">Glissez-déposez pour réorganiser</p>
                )}
              </div>
              
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">Aucun participant pour le moment</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="participants">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {participants.map((participant, index) => (
                          <Draggable 
                            key={participant.uid} 
                            draggableId={participant.uid} 
                            index={index}
                            isDragDisabled={userProfile?.role !== 'initiatrice' || tontine.initiatriceId !== userProfile.uid}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                                  snapshot.isDragging ? 'shadow-lg bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                }`}
                                style={{ borderRadius: '10px', ...provided.draggableProps.style }}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-8 h-8 bg-[#195885] text-white rounded-full flex items-center justify-center font-semibold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{participant.prenom} {participant.nom}</p>
                                    <p className="text-sm text-gray-600">{participant.email}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    participant.statutPaiement === 'confirme' ? 'bg-green-100 text-green-800' :
                                    participant.statutPaiement === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {participant.statutPaiement === 'confirme' ? 'Payé' :
                                     participant.statutPaiement === 'en_attente' ? 'En attente' :
                                     'Non payé'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Paiements récents */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiements Récents</h3>
              
              {paiements.length === 0 ? (
                <p className="text-gray-600 text-sm">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-3">
                  {paiements.slice(0, 5).map((paiement) => (
                    <div key={paiement.paiementId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{paiement.montant.toLocaleString()} FCFA</p>
                        <p className="text-xs text-gray-600">{paiement.datePaiement.toLocaleDateString()}</p>
                      </div>
                      <div className={`flex items-center space-x-1 ${getPaiementStatusColor(paiement.statut)}`}>
                        {getPaiementStatusIcon(paiement.statut)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
              
              <div className="space-y-3">
                {userProfile?.role === 'participant' && (
                  <button
                    onClick={() => navigate(`/paiements/${tontine.tontineId}`)}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    style={{ borderRadius: '10px' }}
                  >
                    Effectuer un paiement
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/paiements')}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  Voir tous les paiements
                </button>
                
                {userProfile?.role === 'initiatrice' && tontine.initiatriceId === userProfile.uid && (
                  <button
                    onClick={shareInvitation}
                    className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                    style={{ borderRadius: '10px' }}
                  >
                    <Share2 className="mr-2" size={16} />
                    Partager invitation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal d'invitation */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Inviter des participants</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code d'invitation
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tontine.codeInvitation || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      style={{ borderRadius: '10px' }}
                    />
                    <button
                      onClick={copyInvitationCode}
                      className="px-3 py-2 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors"
                      style={{ borderRadius: '10px' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lien d'invitation
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tontine.lienInvitation || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      style={{ borderRadius: '10px' }}
                    />
                    <button
                      onClick={copyInvitationLink}
                      className="px-3 py-2 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors"
                      style={{ borderRadius: '10px' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  Fermer
                </button>
                <button
                  onClick={shareInvitation}
                  className="px-4 py-2 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors flex items-center"
                  style={{ borderRadius: '10px' }}
                >
                  <Share2 className="mr-2" size={16} />
                  Partager
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TontineDetails;