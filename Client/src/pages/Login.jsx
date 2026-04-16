import { useState, useEffect } from "react";
import { FaSignInAlt } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, reset } from "../features/auth/authSlice";
import Spinner from "../components/Spinner";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

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
      if (user?.roles.includes("ROLE_ADMIN")) {
        navigate("/admin");
      } else if (user?.roles.includes("ROLE_HR")) {
        navigate("/hr");
      } else if (user?.roles.includes("ROLE_CANDIDAT")) {
        navigate("/candidate");
      }
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
      email,
      password,
    };
    dispatch(login(userData));
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-1 bg-surface-50">
      {/* Left Pane - Image/Branding (Hidden on mobile) */}
      <div className="relative hidden w-0 flex-1 lg:block overflow-hidden">
        <div className="absolute inset-0 bg-brand-900 overflow-hidden">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
            src="/auth-bg.png"
            alt="Abstract Tech"
          />
          {/* Subtle gradient overlay to make things pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/60 to-transparent"></div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <h2 className="text-4xl font-display font-bold text-white tracking-tight animate-slide-up">
            L'Intelligence Artificielle<br />au service du recrutement
          </h2>
          <p className="mt-4 text-brand-100 text-lg font-sans max-w-lg animate-fade-in delay-150">
            Trouvez les meilleurs talents ou décrochez le job de vos rêves grâce à une analyse prédictive ultra-performante.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-6 lg:flex-none lg:w-[32rem] xl:w-[40rem] lg:px-20 xl:px-24 bg-white shadow-2xl z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in">
          <div>
            <h2 className="mt-2 text-3xl font-display font-bold tracking-tight text-surface-900">
              Bon retour !
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                S'inscrire gratuitement
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium leading-5 text-surface-900">
                  Adresse Email
                </label>
                <div className="mt-1.5">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 placeholder:text-surface-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm transition-shadow"
                    placeholder="john.doe@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium leading-5 text-surface-900">
                  Mot de passe
                </label>
                <div className="mt-1.5">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-surface-900 shadow-sm ring-1 ring-inset ring-surface-300 placeholder:text-surface-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-600"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm leading-5 text-surface-700">
                    Se souvenir de moi
                  </label>
                </div>
                <div className="text-sm leading-5">
                  <a href="#" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <FaSignInAlt className="mr-2 h-5 w-5" />
                  Se connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
