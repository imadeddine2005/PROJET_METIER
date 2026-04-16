import axios from "axios";

const API_URL = '/candidate/api/cv-tools';

// Helper pour récupérer la config d'autorisation pour multipart (pour l'upload du CV)
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

// Prédire le métier idéal à partir d'un CV
const predictJob = async (cvFile) => {
  const config = getAuthConfigMultipart();
  
  const formData = new FormData();
  formData.append('cvFile', cvFile);

  const response = await axios.post(`${API_URL}/predict-job`, formData, config);
  
  return response.data; // Retourne l'ApiResponse avec le champ "data" (la prédiction)
};

const cvToolsService = {
  predictJob,
};

export default cvToolsService;
