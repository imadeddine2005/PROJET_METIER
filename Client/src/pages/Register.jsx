import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register, reset } from "../features/auth/authSlice";
import Spinner from "../components/Spinner";
import { FaUserPlus } from "react-icons/fa";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { name, email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      navigate("/login");
      toast.success("Inscription réussie, vous pouvez vous connecter");
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const userData = {
      name,
      email,
      password,
    };
    dispatch(register(userData));
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-1 bg-surface-50">
      {/* Right Pane - Image/Branding (Reversed for visual variation from Login) */}
      <div className="relative hidden w-0 flex-1 lg:block order-2 overflow-hidden">
        <div className="absolute inset-0 bg-brand-900 overflow-hidden">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay scale-105"
            src="/auth-bg.png"
            alt="Abstract Tech"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-900/40 to-transparent"></div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-16 -mt-10">
          <h2 className="text-4xl font-display font-bold text-white tracking-tight animate-slide-up">
            Rejoignez l'écosystème<br />SmartRecruit
          </h2>
          <p className="mt-4 text-brand-100 text-lg font-sans max-w-lg animate-fade-in delay-150">
            Créez votre profil en 2 minutes et laissez notre IA analyser la pertinence de votre parcours selon les attentes du marché.
          </p>
        </div>
      </div>

      {/* Left Pane - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-4 sm:px-6 lg:flex-none lg:w-[32rem] xl:w-[40rem] lg:px-20 xl:px-24 bg-white shadow-2xl z-10 order-1">
        <div className="mx-auto w-full max-w-sm lg:w-full lg:max-w-md animate-fade-in my-auto py-2">
          <div>
            <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-surface-900">
              Créer un compte
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Déjà un compte ?{" "}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                Connectez-vous ici
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              
              {/* Nom => Full width */}
              <div>
                <label className="block text-sm font-medium leading-5 text-surface-900">Nom complet</label>
                <div className="mt-1.5">
                  <input type="text" id="name" name="name" value={name} onChange={onChange} required placeholder="John Doe" className="block w-full rounded-lg border-0 py-2 px-3 text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 placeholder:text-surface-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm transition-shadow" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium leading-5 text-surface-900">Adresse Email</label>
                <div className="mt-1.5">
                  <input type="email" id="email" name="email" value={email} onChange={onChange} required placeholder="john.doe@email.com" className="block w-full rounded-lg border-0 py-2 px-3 text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 placeholder:text-surface-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm transition-shadow" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium leading-5 text-surface-900">Mot de passe</label>
                <div className="mt-1.5">
                  <input type="password" id="password" name="password" value={password} onChange={onChange} required placeholder="••••••••" className="block w-full rounded-lg border-0 py-2 px-3 text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 placeholder:text-surface-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm transition-shadow" />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <FaUserPlus className="mr-2 h-5 w-5" />
                  S'inscrire
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
