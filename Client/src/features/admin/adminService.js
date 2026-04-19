import axios from "axios";

const API_URL = '/admin/api/demandes-acces-cv';

const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.accessToken) {
    return {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    };
  }
  return {};
};

// Obtenir la liste des demandes en attente
const getPendingRequests = async () => {
  const config = getAuthConfig();
  const response = await axios.get(`${API_URL}/en-attente`, config);
  return response.data;
};

// Obtenir l'historique des demandes traitées
const getHistoryRequests = async () => {
  const config = getAuthConfig();
  const response = await axios.get(`${API_URL}/historique`, config);
  return response.data;
};

// Approuver une demande d'accès
const approveRequest = async (demandeId, decisionNote) => {
  const config = getAuthConfig();
  const response = await axios.put(`${API_URL}/${demandeId}/approve`, null, {
      ...config,
      params: { decisionNote }
  });
  return response.data;
};

// Refuser une demande d'accès
const rejectRequest = async (demandeId, decisionNote) => {
  const config = getAuthConfig();
  const response = await axios.put(`${API_URL}/${demandeId}/reject`, null, {
      ...config,
      params: { decisionNote }
  });
  return response.data;
};

// Télécharger le CV pour validation
const getAdminCvPdf = async (demandeId) => {
    const config = getAuthConfig();
    config.responseType = 'blob'; 
    const response = await axios.get(`${API_URL}/${demandeId}/cv`, config);
    return response.data;
};

const adminService = {
  getPendingRequests,
  getHistoryRequests,
  approveRequest,
  rejectRequest,
  getAdminCvPdf
};

export default adminService;
