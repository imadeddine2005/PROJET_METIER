import axios from "axios";

const API_URL = '/hr/api/candidatures';
const DEMANDE_API_URL = '/hr/api/demandes-acces-cv';

// Helper pour récupérer la config d'autorisation
const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    };
  }
  return {};
};

// Obtenir toutes les candidatures pour une offre spécifique
const getCandidaturesForOffer = async (offreId) => {
  const config = getAuthConfig();
  const response = await axios.get(`${API_URL}/${offreId}`, config);
  return response.data;
};

// Modifier le statut d'une candidature
const updateCandidatureStatus = async (candidatureId, newStatus) => {
  const config = getAuthConfig();
  const response = await axios.put(`${API_URL}/${candidatureId}/status`, { newStatus }, config);
  return response.data;
};

// Créer une demande d'accès au CV original
const requestCvAccess = async (candidatureId, motif) => {
  const config = getAuthConfig();
  const response = await axios.post(DEMANDE_API_URL, { candidatureId, motif }, config);
  return response.data;
};

// Obtenir toutes les demandes d'accès d'un recruteur
const getMyAccessRequests = async () => {
  const config = getAuthConfig();
  const response = await axios.get(DEMANDE_API_URL, config);
  return response.data;
};

// Obtenir le PDF du CV Anonymisé
const getAnonymizedCvPdf = async (candidatureId) => {
    const config = getAuthConfig();
    config.responseType = 'blob'; // Important pour télécharger un fichier
    const response = await axios.get(`${DEMANDE_API_URL}/candidature/${candidatureId}/cv-anonymise`, config);
    return response.data;
};

// Obtenir le PDF du CV Original (Si la demande est approuvée)
const getOriginalCvPdf = async (demandeId) => {
    const config = getAuthConfig();
    config.responseType = 'blob'; // Important pour télécharger un fichier
    const response = await axios.get(`${DEMANDE_API_URL}/${demandeId}/cv-original`, config);
    return response.data;
};

// Générer un e-mail via l'IA
const generateEmail = async (candidatureId, language) => {
  const config = getAuthConfig();
  const response = await axios.post(`${API_URL}/${candidatureId}/generate-email`, { language }, config);
  return response.data;
};

// Envoyer l'e-mail
const sendEmail = async (candidatureId, subject, body) => {
  const config = getAuthConfig();
  const response = await axios.post(`${API_URL}/${candidatureId}/send-email`, { subject, body }, config);
  return response.data;
};

// Obtenir l'historique des décisions pour une offre
const getHistoriqueDecisionsForOffer = async (offreId) => {
  const config = getAuthConfig();
  const response = await axios.get(`${API_URL}/${offreId}/history`, config);
  return response.data;
};

const candidatureHrService = {
  getCandidaturesForOffer,
  getHistoriqueDecisionsForOffer,
  updateCandidatureStatus,
  requestCvAccess,
  getMyAccessRequests,
  getAnonymizedCvPdf,
  getOriginalCvPdf,
  generateEmail,
  sendEmail
};

export default candidatureHrService;
