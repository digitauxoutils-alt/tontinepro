export interface User {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  role: 'initiatrice' | 'participant';
  avatarUrl?: string;
  dateCreation: Date;
}

export interface Tontine {
  tontineId: string;
  nom: string;
  description: string;
  type: 'argent' | 'pack' | 'epargne';
  montantCotisation: number;
  frequence: 'hebdomadaire' | 'mensuelle' | 'bimensuelle';
  nombreParticipants?: number;
  participantsIllimites: boolean;
  dateDebut: Date;
  dateFin?: Date;
  trancheRamassageDebut?: Date;
  trancheRamassageFin?: Date;
  jourDeMise: string;
  ordreRamassage: string[];
  statut: 'en_attente' | 'active' | 'suspendue' | 'terminee';
  initiatriceId: string;
  dateCreation: Date;
  codeInvitation: string;
  lienInvitation: string;
}

export interface Participant {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  avatarUrl?: string;
  statutPaiement: 'non_paye' | 'en_attente' | 'paye_confirme';
  capturePaiementUrl?: string;
  dateDernierPaiement?: Date;
  positionRamassage: number;
}

export interface Paiement {
  paiementId: string;
  participantId: string;
  montant: number;
  datePaiement: Date;
  capturePaiementUrl?: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  validateurId?: string;
  dateValidation?: Date;
  periode: string;
}

export interface Notification {
  notificationId: string;
  userId: string;
  message: string;
  type: 'paiement' | 'validation' | 'invitation' | 'rappel';
  lu: boolean;
  dateCreation: Date;
  tontineId?: string;
}