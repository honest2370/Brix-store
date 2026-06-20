import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Lang = "en" | "fr";

const STRINGS: Record<string, { en: string; fr: string }> = {
  // nav
  home: { en: "Home", fr: "Accueil" },
  explore: { en: "Explore", fr: "Explorer" },
  library: { en: "Library", fr: "Bibliothèque" },
  sell: { en: "Sell", fr: "Vendre" },
  account: { en: "Account", fr: "Compte" },
  signIn: { en: "Sign in", fr: "Connexion" },
  signOut: { en: "Sign out", fr: "Déconnexion" },
  myLibrary: { en: "My Library", fr: "Ma bibliothèque" },
  creatorStudio: { en: "Creator Studio", fr: "Studio créateur" },
  storeDesigner: { en: "Store Designer", fr: "Concepteur de boutique" },
  myOrders: { en: "My Orders", fr: "Mes commandes" },
  payouts: { en: "Payouts", fr: "Paiements" },
  transactions: { en: "Transactions", fr: "Transactions" },
  profile: { en: "Profile", fr: "Profil" },
  accountSettings: { en: "Account Settings", fr: "Paramètres du compte" },
  support: { en: "Support", fr: "Assistance" },
  myStorefront: { en: "My Storefront", fr: "Ma vitrine" },
  adminDashboard: { en: "Admin Dashboard", fr: "Tableau admin" },
  notifications: { en: "Notifications", fr: "Notifications" },
  // home / marketplace
  heroBadge: { en: "2026 Launch-Ready · Secure manual payments", fr: "Prêt pour 2026 · Paiements manuels sécurisés" },
  heroTitle: { en: "The elevated hub for digital tools & AI assets", fr: "Le hub premium pour outils numériques & IA" },
  heroSubtitle: { en: "Discover templates, AI prompt packs, courses, presets & more. Pay securely, upload proof, get instant access after approval.", fr: "Découvrez des modèles, packs de prompts IA, cours, presets & plus. Payez en sécurité, envoyez la preuve, accès instantané après approbation." },
  exploreMarketplace: { en: "Explore Marketplace", fr: "Explorer la place de marché" },
  startSelling: { en: "Start Selling", fr: "Commencer à vendre" },
  browseByCategory: { en: "Browse by category", fr: "Parcourir par catégorie" },
  trending: { en: "Trending now", fr: "Tendances" },
  freshArrivals: { en: "Fresh arrivals", fr: "Nouveautés" },
  featured: { en: "Featured collections", fr: "Collections en vedette" },
  viewAll: { en: "View all", fr: "Voir tout" },
  howItWorks: { en: "How Brixnode works", fr: "Comment fonctionne Brixnode" },
  discover: { en: "Discover", fr: "Découvrir" },
  payExternally: { en: "Pay externally", fr: "Payer en externe" },
  uploadProof: { en: "Upload proof", fr: "Envoyer la preuve" },
  instantAccess: { en: "Instant access", fr: "Accès instantané" },
  // product
  getProduct: { en: "Get this product", fr: "Obtenir ce produit" },
  shareLink: { en: "Share product link", fr: "Partager le lien produit" },
  description: { en: "Description", fr: "Description" },
  reviews: { en: "Reviews", fr: "Avis" },
  whatYoullGet: { en: "What you'll get", fr: "Ce que vous obtiendrez" },
  embedThis: { en: "Embed this product", fr: "Intégrer ce produit" },
  // checkout
  checkout: { en: "Checkout", fr: "Paiement" },
  continue: { en: "Continue", fr: "Continuer" },
  back: { en: "Back", fr: "Retour" },
  amountToPay: { en: "Amount to pay", fr: "Montant à payer" },
  choosePayment: { en: "Choose a payment method", fr: "Choisir un mode de paiement" },
  submitOrder: { en: "Submit order", fr: "Soumettre la commande" },
  // common
  save: { en: "Save", fr: "Enregistrer" },
  cancel: { en: "Cancel", fr: "Annuler" },
  loading: { en: "Loading...", fr: "Chargement..." },
  search: { en: "Search", fr: "Rechercher" },
  language: { en: "Language", fr: "Langue" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof STRINGS) => string;
}

const Ctx = createContext<I18nCtx>(null as unknown as I18nCtx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("bx_lang") as Lang) || "en"
  );
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("bx_lang", l);
    document.documentElement.lang = l;
  }, []);
  const t = useCallback(
    (key: keyof typeof STRINGS) => STRINGS[key]?.[lang] || String(key),
    [lang]
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
