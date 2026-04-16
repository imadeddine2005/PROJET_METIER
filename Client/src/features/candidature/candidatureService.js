import axios from "axios";

const API_URL = '/candidate/api/candidatures';

// Helper pour récupérer la config d'autorisation avec le content-type multipart
const getAuthConfigMultipart = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    };
  }
  return {};
};

// Obtenir toutes les candidatures du candidat
const getMyApplications = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const config = {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

// Postuler à une offre (Upload CV)
const applyToOffer = async (offreId, cvFile) => {
  const config = getAuthConfigMultipart();
  
  // Utilisation de FormData pour uploader le fichier
  const formData = new FormData();
  formData.append('cvFile', cvFile);

  // Appel au backend : POST /candidate/api/candidatures/{offreId}
  const response = await axios.post(`${API_URL}/${offreId}`, formData, config);
  
  // Retourne les data de la réponse (qui contient les infos IA expédiées par le serveur)
  return response.data;
};

// Télécharger/Visualiser son propre CV
const downloadMyCv = async (candidatureId) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const config = {
    headers: {
      Authorization: `Bearer ${user?.accessToken}`,
    },
    responseType: 'blob', // Important pour recevoir un fichier
  };
  const response = await axios.get(`${API_URL}/${candidatureId}/my-cv`, config);
  return response.data;
};

const candidatureService = {
  getMyApplications,
  applyToOffer,
  downloadMyCv,
};

export default candidatureService;
