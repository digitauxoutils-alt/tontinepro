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

      const docRef = await addDoc(collection(db, 'tontines'), {
        ...tontineData,
        dateCreation: Timestamp.fromDate(tontineData.dateCreation),
        dateDebut: Timestamp.fromDate(tontineData.dateDebut),
        dateFin: tontineData.dateFin ? Timestamp.fromDate(tontineData.dateFin) : null,
        trancheRamassageDebut: tontineData.trancheRamassageDebut ? Timestamp.fromDate(tontineData.trancheRamassageDebut) : null,
        trancheRamassageFin: tontineData.trancheRamassageFin ? Timestamp.fromDate(tontineData.trancheRamassageFin) : null,
      });

      toast.success('Tontine créée avec succès !');
      navigate(`/tontines/${docRef.id}`);
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
          {/* Informations générales */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Info className="mr-2 text-[#195885]" size={20} />
              Informations Générales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la tontine *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  placeholder="Ex: Tontine des Amis"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  placeholder="Décrivez votre tontine..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de tontine *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  required
                >
                  <option value="argent">Argent</option>
                  <option value="pack">Pack</option>
                  <option value="epargne">Épargne</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de cotisation (FCFA) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    name="montantCotisation"
                    value={formData.montantCotisation}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                    style={{ borderRadius: '10px' }}
                    placeholder="50000"
                    min="1000"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="mr-2 text-[#195885]" size={20} />
              Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence *
                </label>
                <select
                  name="frequence"
                  value={formData.frequence}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  required
                >
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="bimensuelle">Bimensuelle</option>
                  <option value="mensuelle">Mensuelle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jour de mise *
                </label>
                <select
                  name="jourDeMise"
                  value={formData.jourDeMise}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  required
                >
                  <option value="lundi">Lundi</option>
                  <option value="mardi">Mardi</option>
                  <option value="mercredi">Mercredi</option>
                  <option value="jeudi">Jeudi</option>
                  <option value="vendredi">Vendredi</option>
                  <option value="samedi">Samedi</option>
                  <option value="dimanche">Dimanche</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    name="participantsIllimites"
                    checked={formData.participantsIllimites}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#195885] border-gray-300 rounded focus:ring-[#195885]"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Participants illimités
                  </label>
                </div>

                {!formData.participantsIllimites && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de participants *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        name="nombreParticipants"
                        value={formData.nombreParticipants}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                        style={{ borderRadius: '10px' }}
                        placeholder="10"
                        min="2"
                        required={!formData.participantsIllimites}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="mr-2 text-[#195885]" size={20} />
              Dates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                />
              </div>

              {formData.type === 'epargne' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Début tranche de ramassage
                    </label>
                    <input
                      type="date"
                      name="trancheRamassageDebut"
                      value={formData.trancheRamassageDebut}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fin tranche de ramassage
                    </label>
                    <input
                      type="date"
                      name="trancheRamassageFin"
                      value={formData.trancheRamassageFin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

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
      </div>
    </div>
  );
};

export default CreateTontine;