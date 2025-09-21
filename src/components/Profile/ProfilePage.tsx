import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: userProfile?.nom || '',
    prenom: userProfile?.prenom || '',
    email: userProfile?.email || '',
    telephone: userProfile?.telephone || '',
    adresse: userProfile?.adresse || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        adresse: formData.adresse,
      });

      toast.success('Profil mis à jour avec succès !');
      setIsEditing(false);
      // Recharger la page pour mettre à jour le contexte
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: userProfile?.nom || '',
      prenom: userProfile?.prenom || '',
      email: userProfile?.email || '',
      telephone: userProfile?.telephone || '',
      adresse: userProfile?.adresse || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#195885]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {/* Photo de profil */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-[#195885] rounded-full flex items-center justify-center">
                    {userProfile.avatarUrl ? (
                      <img 
                        src={userProfile.avatarUrl} 
                        alt="Avatar" 
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-white" size={48} />
                    )}
                  </div>
                  <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Camera className="text-gray-600" size={16} />
                  </button>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Informations Personnelles</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#195885] text-white rounded-lg hover:bg-[#144a6b] transition-colors"
                      style={{ borderRadius: '10px' }}
                    >
                      <Edit3 size={16} />
                      <span>Modifier</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ borderRadius: '10px' }}
                      >
                        <X size={16} />
                        <span>Annuler</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ borderRadius: '10px' }}
                      >
                        <Save size={16} />
                        <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                        style={{ borderRadius: '10px' }}
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userProfile.prenom}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                        style={{ borderRadius: '10px' }}
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userProfile.nom}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="text-gray-400" size={18} />
                      <span className="text-gray-900">{userProfile.email}</span>
                      <span className="text-xs text-gray-500 ml-auto">Non modifiable</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                        style={{ borderRadius: '10px' }}
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userProfile.telephone || 'Non renseigné'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Shield className="text-gray-400" size={18} />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.role === 'initiatrice' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userProfile.role === 'initiatrice' ? 'Initiatrice' : 'Participant'}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                        style={{ borderRadius: '10px' }}
                        placeholder="Votre adresse"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="text-gray-400" size={18} />
                        <span className="text-gray-900">{userProfile.adresse || 'Non renseignée'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Membre depuis</span>
                  <span className="font-medium">
                    {userProfile.dateCreation?.toLocaleDateString()}
                  </span>
                </div>
                
                {userProfile.role === 'initiatrice' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tontines créées</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Participants gérés</span>
                      <span className="font-medium">-</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tontines rejointes</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Paiements effectués</span>
                      <span className="font-medium">-</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Paramètres */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell className="text-gray-400" size={18} />
                  <span className="text-gray-700">Notifications</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Settings className="text-gray-400" size={18} />
                  <span className="text-gray-700">Préférences</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Shield className="text-gray-400" size={18} />
                  <span className="text-gray-700">Sécurité</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-[#195885] text-white py-3 px-4 rounded-lg hover:bg-[#144a6b] transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  Retour au Dashboard
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                  style={{ borderRadius: '10px' }}
                >
                  <LogOut size={18} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;