// src/types/index.ts

// Utilisateur
export interface User {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  role: "initiatrice" | "participant";
  avatarUrl?: string;
  dateCreation: string; // ISO date
}

// Participant d’une tontine
export interface Participant {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  avatarUrl?: string;
  statutPaiement: "en_attente" | "confirme" | "non_paye";
  capturePaiementUrl?: string;
  dateDernierPaiement?: string;
  positionRamassage?: number;
}

// Paiement
export interface Paiement {
  paiementId: string;
  participantId: string;
  montant: number;
  datePaiement: string; // ISO date
  capturePaiementUrl?: string;
  statut: "en_attente" | "confirme" | "refuse";
  validateurId?: string;
  dateValidation?: string;
}

// Tontine
export interface Tontine {
  tontineId: string;
  nom: string;
  description?: string;
  type: "traditionnelle_argent" | "traditionnelle_pack" | "epargne";
  montantCotisation?: number;
  frequence: "quotidien" | "hebdomadaire" | "mensuel";
  nombreParticipants?: number;
  participantsIllimites?: boolean;
  dateDebut: string;
  dateFin?: string;
  trancheRamassageDebut?: string;
  trancheRamassageFin?: string;
  jourDeMise?: string;
  ordreRamassage?: string[]; // tableau d’uid
  statut: "active" | "suspendue" | "terminee";
  initiatriceId: string;
  dateCreation: string;
}

// Notification
export interface Notification {
  notificationId: string;
  userId: string;
  message: string;
  type: "info" | "rappel" | "alerte";
  lu: boolean;
  dateCreation: string;
}
