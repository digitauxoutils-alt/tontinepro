import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    role: 'participant' as 'initiatrice' | 'participant'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        await resetPassword(formData.email);
        setIsResetPassword(false);
        setIsLogin(true);
      } else if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await register({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          role: formData.role
        }, formData.password);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#195885] to-[#2a7ba0] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#195885] mb-2">TontinePro</h1>
          <p className="text-gray-600">
            {isResetPassword 
              ? 'Réinitialiser votre mot de passe'
              : isLogin 
                ? 'Connectez-vous à votre compte' 
                : 'Créez votre compte'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && !isResetPassword && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                      style={{ borderRadius: '10px' }}
                      placeholder="Prénom"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                      style={{ borderRadius: '10px' }}
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                    style={{ borderRadius: '10px' }}
                    placeholder="Numéro de téléphone"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse (optionnel)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                    style={{ borderRadius: '10px' }}
                    placeholder="Votre adresse"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  required
                >
                  <option value="participant">Participant</option>
                  <option value="initiatrice">Initiatrice</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                style={{ borderRadius: '10px' }}
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          {!isResetPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#195885] focus:border-transparent transition-all"
                  style={{ borderRadius: '10px' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#195885] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#144a6b] focus:ring-2 focus:ring-[#195885] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '10px' }}
          >
            {loading ? 'Chargement...' : 
             isResetPassword ? 'Envoyer le lien' :
             isLogin ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isResetPassword && (
            <>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#195885] hover:text-[#144a6b] font-medium transition-colors"
              >
                {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
              </button>
              {isLogin && (
                <div>
                  <button
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm text-gray-600 hover:text-[#195885] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </>
          )}
          {isResetPassword && (
            <button
              onClick={() => {
                setIsResetPassword(false);
                setIsLogin(true);
              }}
              className="text-[#195885] hover:text-[#144a6b] font-medium transition-colors"
            >
              Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;