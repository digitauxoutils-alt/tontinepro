import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Save,
  Info
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Tontine } from '../../types';
import toast from 'react-hot-toast';

const CreateTontine: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    type: 'argent' as 'argent' | 'pack' | 'epargne',
    montantCotisation: '',
    frequence: 'mensuelle' as 'hebdomadaire' | 'mensuelle' | 'bimensuelle',
    nombreParticipants: '',
    participantsIllimites: false,
    dateDebut: '',
    dateFin: '',
    trancheRamassageDebut: '',
    trancheRamassageFin: '',
    jourDeMise: 'lundi'
  });

  // ✅ Nouveaux états pour affichage du code et du lien
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const generateInvitationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);

    try {
      const codeInvitation = generateInvitationCode();
      const lienInvitation = `${window.location.origin}/join/${codeInvitation}`;

      const tontineData: Omit<Tontine, 'tontineId'> = {
        nom: formData.nom,
        description: formData.description,
        type: formData.type,
        montantCotisation: parseInt(formData.montantCotisation),
        frequence: formData.frequence,
        nombreParticipants: formData.participantsIllimites ? undefined : parseInt(formData.nombreParticipants),
        participantsIllimites: formData.participantsIllimites,
        dateDebut: new Date(formData.dateDebut),
        dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
        trancheRamassageDebut: formData.trancheRamassageDebut ? new Date(formData.trancheRamassageDebut) : undefined,
        trancheRamassageFin: formData.trancheRamassageFin ? new Date(formData.trancheRamassageFin) : undefined,
        jourDeMise: formData.jourDeMise,
        ordreRamassage: [],
        statut: 'en_attente',
        initiatriceId: userProfile.uid,
        dateCreation: new Date(),
        codeInvitation,
        lienInvitation
      };

      await addDoc(collection(db, 'tontines'), {
        ...tontineData,
        dateCreation: Timestamp.fromDate(tontineData.dateCreation),
        dateDebut: Timestamp.fromDate(tontineData.dateDebut),
        dateFin: tontineData.dateFin ? Timestamp.fromDate(tontineData.dateFin) : null,
        trancheRamassageDebut: tontineData.trancheRamassageDebut ? Timestamp.fromDate(tontineData.trancheRamassageDebut) : null,
        trancheRamassageFin: tontineData.trancheRamassageFin ? Timestamp.fromDate(tontineData.trancheRamassageFin) : null,
      });

      // ✅ Stocker les infos pour affichage
      setCreatedCode(codeInvitation);
      setCreatedLink(lienInvitation);

      toast.success('Tontine créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la tontine:', error);
      toast.error('Erreur lors de la création de la tontine');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Créer une Tontine</h1>
            <p className="text-gray-600">Configurez votre nouvelle tontine</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ... ton formulaire existant inchangé ... */}
          
          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ borderRadius: '10px' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '10px' }}
            >
              <Save size={18} />
              <span>{loading ? 'Création...' : 'Créer la Tontine'}</span>
            </button>
          </div>
        </form>

        {/* ✅ Bloc affichage du code et lien */}
        {createdCode && createdLink && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-semibold">
              ✅ Tontine créée avec succès !
            </p>
            <p className="mt-2 text-sm text-green-600">
              Code d’invitation : <b>{createdCode}</b>
            </p>
            <p className="mt-1 text-sm">
              Partagez ce lien :{" "}
              <a
                href={createdLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {createdLink}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTontine;
