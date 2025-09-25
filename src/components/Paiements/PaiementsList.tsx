import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle,
  Filter,
  Search,
  Eye,
  Upload,
  DollarSign
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Paiement, Tontine } from '../../types';
import toast from 'react-hot-toast';

const PaiementsList: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirme' | 'en_attente' | 'refuse'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile) return;

    try {
      let paiementsData: Paiement[] = [];
      let tontinesData: Tontine[] = [];

      if (userProfile.role === 'initiatrice') {
        // Récupérer les tontines de l'initiatrice
        const tontinesQuery = query(
          collection(db, 'tontines'),
          where('initiatriceId', '==', userProfile.uid)
        );
        const tontinesSnapshot = await getDocs(tontinesQuery);
        
        for (const tontineDoc of tontinesSnapshot.docs) {
          const tontineData = {
            ...tontineDoc.data(),
            tontineId: tontineDoc.id,
            dateCreation: tontineDoc.data().dateCreation?.toDate(),
            dateDebut: tontineDoc.data().dateDebut?.toDate(),
            dateFin: tontineDoc.data().dateFin?.toDate(),
          } as Tontine;
          tontinesData.push(tontineData);

          // Récupérer tous les paiements de cette tontine
          const paiementsQuery = query(
            collection(db, 'tontines', tontineDoc.id, 'paiements'),
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
          
          paiementsData.push(...tontinePaiements);
        }
      } else {
        // Pour les participants, récupérer leurs paiements
        const allTontinesQuery = query(collection(db, 'tontines'));
        const allTontinesSnapshot = await getDocs(allTontinesQuery);
        
        for (const tontineDoc of allTontinesSnapshot.docs) {
          // Vérifier si l'utilisateur est participant
          const participantDoc = await getDocs(
            query(
              collection(db, 'tontines', tontineDoc.id, 'participants'),
              where('uid', '==', userProfile.uid)
            )
          );

          if (!participantDoc.empty) {
            const tontineData = {
              ...tontineDoc.data(),
              tontineId: tontineDoc.id,
              dateCreation: tontineDoc.data().dateCreation?.toDate(),
              dateDebut: tontineDoc.data().dateDebut?.toDate(),
              dateFin: tontineDoc.data().dateFin?.toDate(),
            } as Tontine;
            tontinesData.push(tontineData);

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
            
            paiementsData.push(...tontinePaiements);
          }
        }
      }

      setPaiements(paiementsData);
      setTontines(tontinesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayment = async (paiementId: string, tontineId: string, action: 'confirme' | 'refuse') => {
    try {
      await updateDoc(doc(db, 'tontines', tontineId, 'paiements', paiementId), {
        statut: action,
        validateurId: userProfile?.uid,
        dateValidation: Timestamp.now()
      });

      toast.success(`Paiement ${action === 'confirme' ? 'validé' : 'refusé'} avec succès`);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur lors de la validation du paiement');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTontine || !paymentAmount || !userProfile) return;

    const selectedTontineData = tontines.find(t => t.tontineId === selectedTontine);
    if (!selectedTontineData) {
      toast.error('Tontine non trouvée');
      return;
    }
    try {
      const paiementData = {
        participantId: userProfile.uid,
        participantNom: `${userProfile.prenom} ${userProfile.nom}`,
        montant: parseInt(paymentAmount),
        datePaiement: Timestamp.now(),
        statut: 'en_attente',
        capturePaiementUrl: paymentProof ? 'uploaded' : null, // Simulation d'upload
        periode: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        tontineNom: selectedTontineData.nom
      };

      await addDoc(collection(db, 'tontines', selectedTontine, 'paiements'), paiementData);
      
      toast.success('Paiement enregistré avec succès ! En attente de validation.');
      setShowPaymentModal(false);
      setSelectedTontine('');
      setPaymentAmount('');
      setPaymentProof(null);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'confirme': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'confirme': return <CheckCircle size={16} />;
      case 'en_attente': return <Clock size={16} />;
      case 'refuse': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'confirme': return 'Confirmé';
      case 'en_attente': return 'En attente';
      case 'refuse': return 'Refusé';
      default: return statut;
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    const matchesFilter = filter === 'all' || paiement.statut === filter;
    const matchesSearch = paiement.tontineNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paiement.participantNom?.toLowerCase().includes(searchTerm.toLowerCase());
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
              {userProfile?.role === 'initiatrice' ? 'Gestion des Paiements' : 'Mes Paiements'}
            </h1>
            <p className="text-gray-600">
              {userProfile?.role === 'initiatrice' 
                ? 'Validez les paiements de vos participants' 
                : 'Suivez vos paiements et cotisations'
              }
            </p>
          </div>
          {userProfile?.role === 'participant' && tontines.length > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center"
              style={{ borderRadius: '10px' }}
            >
              <CreditCard className="mr-2" size={20} />
              Nouveau Paiement
            </button>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paiements</p>
                <p className="text-2xl font-bold text-gray-900">{paiements.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <CreditCard className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmés</p>
                <p className="text-2xl font-bold text-green-600">
                  {paiements.filter(p => p.statut === 'confirme').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {paiements.filter(p => p.statut === 'en_attente').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refusés</p>
                <p className="text-2xl font-bold text-red-600">
                  {paiements.filter(p => p.statut === 'refuse').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="text-red-600" size={20} />
              </div>
            </div>
          </div>
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
                <option value="all">Tous les statuts</option>
                <option value="confirme">Confirmés</option>
                <option value="en_attente">En attente</option>
                <option value="refuse">Refusés</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent w-full md:w-80"
                style={{ borderRadius: '10px' }}
              />
            </div>
          </div>
        </div>

        {/* Liste des paiements */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {filteredPaiements.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun paiement</h3>
              <p className="text-gray-600">
                {userProfile?.role === 'participant' 
                  ? 'Vous n\'avez effectué aucun paiement pour le moment'
                  : 'Aucun paiement à valider pour le moment'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tontine
                    </th>
                    {userProfile?.role === 'initiatrice' && (
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPaiements.map((paiement) => (
                    <tr key={paiement.paiementId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {paiement.tontineNom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {paiement.periode}
                          </div>
                        </div>
                      </td>
                      {userProfile?.role === 'initiatrice' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {paiement.participantNom}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paiement.montant.toLocaleString()} FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paiement.datePaiement.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paiement.datePaiement.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(paiement.statut)}`}>
                          {getStatusIcon(paiement.statut)}
                          <span className="ml-1">{getStatusText(paiement.statut)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {userProfile?.role === 'initiatrice' && paiement.statut === 'en_attente' && (
                            <>
                              <button
                                onClick={() => handleValidatePayment(paiement.paiementId, paiement.tontineId, 'confirme')}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Valider"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleValidatePayment(paiement.paiementId, paiement.tontineId, 'refuse')}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Refuser"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {/* Voir détails */}}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de nouveau paiement */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nouveau Paiement</h3>
              
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tontine
                  </label>
                  <select
                    value={selectedTontine}
                    onChange={(e) => setSelectedTontine(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent"
                    style={{ borderRadius: '10px' }}
                    required
                  >
                    <option value="">Sélectionnez une tontine</option>
                    {tontines.filter(t => t.statut === 'active').map(tontine => (
                      <option key={tontine.tontineId} value={tontine.tontineId}>
                        {tontine.nom} - {tontine.montantCotisation?.toLocaleString()} FCFA
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (FCFA)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent"
                      style={{ borderRadius: '10px' }}
                      placeholder={selectedTontine ? tontines.find(t => t.tontineId === selectedTontine)?.montantCotisation?.toString() : "50000"}
                      required
                    />
                  </div>
                  {selectedTontine && (
                    <p className="text-sm text-gray-500 mt-1">
                      Montant suggéré: {tontines.find(t => t.tontineId === selectedTontine)?.montantCotisation?.toLocaleString()} FCFA
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preuve de paiement (optionnel)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="flex items-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: '10px' }}
                    >
                      <Upload className="mr-2" size={16} />
                      {paymentProof ? paymentProof.name : 'Choisir un fichier'}
                    </label>
                    {paymentProof && (
                      <button
                        type="button"
                        onClick={() => setPaymentProof(null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés: JPG, PNG, PDF (max 5MB)
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedTontine('');
                      setPaymentAmount('');
                      setPaymentProof(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderRadius: '10px' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    style={{ borderRadius: '10px' }}
                  >
                    Enregistrer le paiement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementsList;