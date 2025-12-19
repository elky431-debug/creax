"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BankSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [iban, setIban] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bic, setBic] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    if (session.user.role !== "DESIGNER") {
      router.push("/dashboard");
      return;
    }

    fetchBankInfo();
  }, [session, status, router]);

  const fetchBankInfo = async () => {
    try {
      const res = await fetch("/api/profile/bank");
      if (res.ok) {
        const data = await res.json();
        if (data.bankAccountHolder) setBankAccountHolder(data.bankAccountHolder);
        if (data.bankName) setBankName(data.bankName);
        if (data.bic) setBic(data.bic);
        setIsConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error("Erreur chargement infos bancaires:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatIban = (value: string) => {
    const clean = value.replace(/\s/g, "").toUpperCase();
    return clean.match(/.{1,4}/g)?.join(" ") || clean;
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIban(formatIban(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iban: iban.replace(/\s/g, ""),
          bankAccountHolder,
          bankName,
          bic
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors de l'enregistrement" });
        return;
      }

      setMessage({ type: "success", text: "Informations bancaires enregistrées avec succès !" });
      setIsConfigured(true);
      setIban(""); // Réinitialiser pour sécurité
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-creix-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-creix-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creix-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-creix-cyan/10 to-emerald-500/10 border-b border-creix-cyan/20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            href="/dashboard" 
            className="text-creix-cyan hover:text-creix-cyan/80 mb-4 inline-flex items-center gap-2"
          >
            ← Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">
            <span className="text-creix-cyan">💳</span> Paramètres de paiement
          </h1>
          <p className="text-gray-400 mt-2">
            Configurez vos informations bancaires pour recevoir vos paiements
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className={`rounded-xl p-6 mb-8 border ${
          isConfigured 
            ? "bg-emerald-500/10 border-emerald-500/30" 
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isConfigured ? "bg-emerald-500/20" : "bg-yellow-500/20"
            }`}>
              {isConfigured ? "✓" : "⚠️"}
            </div>
            <div>
              <h3 className={`font-semibold ${isConfigured ? "text-emerald-400" : "text-yellow-400"}`}>
                {isConfigured ? "Compte bancaire configuré" : "Configuration requise"}
              </h3>
              <p className="text-sm text-gray-400">
                {isConfigured 
                  ? "Vous pouvez recevoir des paiements sur votre compte bancaire."
                  : "Ajoutez vos informations bancaires pour recevoir vos paiements."}
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-creix-cyan/5 border border-creix-cyan/20 rounded-xl p-6 mb-8">
          <h3 className="text-creix-cyan font-semibold mb-3 flex items-center gap-2">
            <span>🔒</span> Sécurité de vos données
          </h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Vos informations bancaires sont cryptées et sécurisées</li>
            <li>• Nous ne stockons jamais votre numéro de carte bancaire</li>
            <li>• Les paiements sont traités via Stripe, leader mondial du paiement</li>
            <li>• Vous recevrez les fonds directement sur votre compte sous 2-5 jours ouvrés</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-creix-gray/30 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-6">Informations bancaires</h2>

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.type === "success" 
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" 
                  : "bg-red-500/20 border border-red-500/40 text-red-400"
              }`}>
                {message.text}
              </div>
            )}

            {/* Titulaire du compte */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom du titulaire du compte *
              </label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 bg-creix-black border border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-creix-cyan focus:border-transparent text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Nom complet tel qu&apos;il apparaît sur votre compte bancaire
              </p>
            </div>

            {/* IBAN */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IBAN *
              </label>
              <input
                type="text"
                value={iban}
                onChange={handleIbanChange}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                className="w-full px-4 py-3 bg-creix-black border border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-creix-cyan focus:border-transparent text-white 
                         font-mono tracking-wider"
                required={!isConfigured}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isConfigured 
                  ? "Laissez vide pour conserver l'IBAN actuel, ou entrez un nouveau pour le modifier"
                  : "Votre numéro IBAN complet (commence par le code pays, ex: FR)"}
              </p>
            </div>

            {/* BIC */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BIC / SWIFT (optionnel)
              </label>
              <input
                type="text"
                value={bic}
                onChange={(e) => setBic(e.target.value.toUpperCase())}
                placeholder="BNPAFRPP"
                className="w-full px-4 py-3 bg-creix-black border border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-creix-cyan focus:border-transparent text-white 
                         font-mono"
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">
                Code d&apos;identification de votre banque (8 ou 11 caractères)
              </p>
            </div>

            {/* Nom de la banque */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la banque (optionnel)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BNP Paribas"
                className="w-full px-4 py-3 bg-creix-black border border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-creix-cyan focus:border-transparent text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving || (!iban && !isConfigured)}
            className="w-full py-4 bg-gradient-to-r from-creix-cyan to-emerald-500 text-black 
                     font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Enregistrement...
              </span>
            ) : (
              "💾 Enregistrer mes informations bancaires"
            )}
          </button>
        </form>

        {/* FAQ */}
        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-semibold">Questions fréquentes</h2>
          
          <div className="space-y-4">
            <div className="bg-creix-gray/30 rounded-xl p-5 border border-gray-800">
              <h4 className="font-medium text-white mb-2">Quand vais-je recevoir mes paiements ?</h4>
              <p className="text-sm text-gray-400">
                Les paiements sont traités automatiquement dès que le créateur valide et paie votre travail. 
                Les fonds arrivent sur votre compte sous 2 à 5 jours ouvrés.
              </p>
            </div>
            
            <div className="bg-creix-gray/30 rounded-xl p-5 border border-gray-800">
              <h4 className="font-medium text-white mb-2">Y a-t-il des frais ?</h4>
              <p className="text-sm text-gray-400">
                CREIX prélève une commission de 10% sur chaque transaction pour maintenir la plateforme. 
                Aucuns frais cachés supplémentaires.
              </p>
            </div>
            
            <div className="bg-creix-gray/30 rounded-xl p-5 border border-gray-800">
              <h4 className="font-medium text-white mb-2">Mes données bancaires sont-elles sécurisées ?</h4>
              <p className="text-sm text-gray-400">
                Oui, vos informations sont cryptées et nous utilisons Stripe, le processeur de paiement 
                utilisé par des millions d&apos;entreprises dans le monde.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


