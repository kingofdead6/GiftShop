import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { wilayas } from '../data/catalogue';
import { EASE } from '../lib/motion';
import PrintCanvas from '../components/PrintCanvas';
import { RiseLines } from '../components/Chrome';
import { Field, SubmitButton, Tabs } from '../components/AccountUI';

const PHONE = /^0(5|6|7)\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanPhone = (v) => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('213')) d = `0${d.slice(3)}`;
  return d;
};

function LoginForm({ onDone }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = 'Ton téléphone ou ton email';
    if (!form.password) errs.password = 'Ton mot de passe';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await login(form.identifier.trim(), form.password);
      onDone(u, false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field
        label="Téléphone ou email"
        autoComplete="username"
        placeholder="0550 00 00 00"
        value={form.identifier}
        onChange={(e) => setForm({ ...form, identifier: e.target.value })}
        error={errors.identifier}
      />
      <Field
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
      />
      <FormError message={errors.form} />
      <SubmitButton loading={loading} className="mt-2">
        Se connecter
      </SubmitButton>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', wilaya: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Ton nom';
    if (!PHONE.test(cleanPhone(form.telephone))) errs.telephone = '05, 06 ou 07 suivi de 8 chiffres';
    if (form.email.trim() && !EMAIL.test(form.email.trim())) errs.email = 'Email invalide';
    if (form.password.length < 6) errs.password = 'Au moins 6 caractères';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await register({ ...form, nom: form.nom.trim(), email: form.email.trim() });
      onDone(u, true);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Nom" autoComplete="name" placeholder="Prénom Nom" value={form.nom} onChange={set('nom')} error={errors.nom} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0550 00 00 00"
          value={form.telephone}
          onChange={set('telephone')}
          error={errors.telephone}
        />
        <Field label="Wilaya" as="select" value={form.wilaya} onChange={set('wilaya')}>
          <option value="">Choisir…</option>
          {wilayas.map((w, i) => (
            <option key={w} value={w}>
              {String(i + 1).padStart(2, '0')} · {w}
            </option>
          ))}
        </Field>
      </div>
      <Field
        label="Email"
        hint="optionnel"
        type="email"
        autoComplete="email"
        placeholder="toi@exemple.com"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
      />
      <Field
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={set('password')}
        error={errors.password}
      />
      <FormError message={errors.form} />
      <SubmitButton loading={loading} className="mt-2">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}

function FormError({ message }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="alert"
          className="overflow-hidden rounded-2xl bg-ember/10 px-4 py-3 text-[15px] text-ink"
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

export default function Auth() {
  const { isLoggedIn, isAdmin, loading, offline } = useAuth();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'inscription' ? 'register' : 'login');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  useEffect(() => {
    setParams(mode === 'register' ? { mode: 'inscription' } : {}, { replace: true });
  }, [mode, setParams]);

  if (!loading && isLoggedIn) return <Navigate to={from || (isAdmin ? '/admin' : '/compte')} replace />;

  const onDone = (u, created) => {
    const prenom = u.nom.split(' ')[0];
    toast(created ? `Bienvenue chez illueur, ${prenom} ✦` : `Salam ${prenom} 👋`);
    const admin = ['ADMIN', 'SUPER_ADMIN'].includes(u.role);
    navigate(from || (admin ? '/admin' : '/compte'), { replace: true });
  };

  return (
    <section className="grid min-h-[100svh] lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden bg-ink text-bone lg:block">
        <div className="layer-lines-light absolute inset-0" />
        <div className="absolute inset-x-0 bottom-[12%] top-[34%]">
          <PrintCanvas shape={mode === 'register' ? 'citron' : 'vague'} color={mode === 'register' ? '#F2C230' : '#F4E7D3'} printOnView spin tilt={0.3} className="h-full w-full" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-10 pt-32">
          <h2 className="display text-[clamp(56px,6vw,104px)]">
            <AnimatePresence mode="wait">
              <motion.span key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="block">
                {mode === 'register' ? (
                  <RiseLines animateNow lines={['Ton compte,', <span key="a" className="serif-i font-normal text-ember">couche par couche.</span>]} />
                ) : (
                  <RiseLines animateNow lines={['Re-salam.', <span key="a" className="serif-i font-normal text-ember">Content de te revoir.</span>]} />
                )}
              </motion.span>
            </AnimatePresence>
          </h2>
          <ul className="mono flex flex-col gap-2 text-smoke">
            <li>✦ Suis tes demandes jusqu’à ta porte</li>
            <li>✦ Garde tes pièces préférées</li>
            <li>✦ Ta wilaya déjà remplie à chaque commande</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 pb-16 pt-28 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          className="w-full max-w-[480px]"
        >
          <p className="mono text-ash">Espace client</p>
          <h1 className="display mt-4 text-[clamp(48px,6vw,80px)]">{mode === 'register' ? 'Inscription' : 'Connexion'}</h1>
          <div className="mt-8">
            <Tabs
              id="auth"
              value={mode}
              onChange={setMode}
              tabs={[
                { id: 'login', label: 'J’ai un compte' },
                { id: 'register', label: 'Créer un compte' },
              ]}
            />
          </div>

          {offline ? (
            <p className="mt-6 rounded-2xl border border-ember/40 px-4 py-3 text-[14px] text-ash">
              Le serveur ne répond pas. Lance-le avec <code className="font-mono">npm run dev</code> dans <code className="font-mono">server/</code>.
            </p>
          ) : null}

          <div className="mt-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'register' ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'register' ? -30 : 30 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {mode === 'register' ? <RegisterForm onDone={onDone} /> : <LoginForm onDone={onDone} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-8 text-center text-[14px] text-ash">
            Pas besoin de compte pour commander : ta sélection part en DM dans tous les cas.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
