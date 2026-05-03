import axios from "axios";

const API_URL = '/candidate/api/offres';
const HR_API_URL = '/hr/api/offres';

// Get auth token from localStorage
const getAuthConfig = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  console.log("getAuthConfig - user from localStorage:", user);
  
  if (user && user.accessToken) {
    console.log("Token trouvé:", user.accessToken.substring(0, 20) + "...");
    return {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    };
  }
  console.log("❌ PAS DE TOKEN! Retour config vide");
  return {};
};

const getOffres = async () => {
  const config = getAuthConfig();
  const response = await axios.get(API_URL, config); 
  return response.data.data || response.data;
};

// Get single offer details for candidate
const getOffreByIdCandidate = async (offreId) => {
  const config = getAuthConfig();
  const response = await axios.get(`${API_URL}/${offreId}`, config);
  return response.data.data || response.data;
};

// Get single offer by ID for editing (HR)
const getOffreById = async (offreId) => {
  const config = getAuthConfig();
  const response = await axios.get(`${HR_API_URL}/${offreId}`, config);
  return response.data.data || response.data;
};

// HR - Get offers list (requires auth)
const getMyOffres = async () => {
  const config = getAuthConfig();
  const response = await axios.get(`${HR_API_URL}/mes-offres`, config);
  return response.data.data || response.data;
};

// HR - Get all offers (requires auth)
const getAllOffresHr = async () => {
  const config = getAuthConfig();
  const response = await axios.get(`${HR_API_URL}/all`, config);
  return response.data.data || response.data;
};

// HR - Create new offer (requires auth)
const createOffre = async (offreData) => {
  const config = getAuthConfig();
  const response = await axios.post(HR_API_URL, offreData, config);
  return response.data.data || response.data;
};

// HR - Update offer (requires auth)
const updateOffre = async (offreId, offreData) => {
  const config = getAuthConfig();
  const response = await axios.put(`${HR_API_URL}/${offreId}`, offreData, config);
  return response.data.data || response.data;
};

// HR - Delete offer (requires auth)
const deleteOffre = async (offreId) => {
  const config = getAuthConfig();
  const response = await axios.delete(`${HR_API_URL}/${offreId}`, config);
  return response.data;
};

const offreService = {
  getOffres,
  getOffreByIdCandidate,
  getOffreById,
  getMyOffres,
  getAllOffresHr,
  createOffre,
  updateOffre,
  deleteOffre,
};

export default offreService;
