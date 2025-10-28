
'use client';
import { GenericPage } from "@/components/generic-page";

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <GenericPage
      title="Politique de confidentialité"
      description={`Dernière mise à jour : ${lastUpdated}`}
    >
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Votre vie privée est importante pour nous. Cette politique de confidentialité explique comment CygnisAI collecte, utilise, et protège vos informations personnelles.</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Collecte des informations</h2>
          <p>Nous collectons les informations que vous nous fournissez directement :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Informations de compte :</strong> Lorsque vous créez un compte, nous collectons votre adresse e-mail, votre nom d'utilisateur et votre mot de passe chiffré. Si vous vous connectez via un service tiers (Google, GitHub), nous recevons les informations de profil de base.</li>
            <li><strong>Contenu utilisateur :</strong> Nous collectons les messages, prompts, et fichiers que vous envoyez via le chat pour fournir le service.</li>
            <li><strong>Informations d'abonnement :</strong> Si vous souscrivez à un plan Pro, nos partenaires de paiement (Stripe) traitent vos informations de paiement. Nous ne stockons pas vos détails de carte de crédit.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Utilisation des informations</h2>
          <p>Nous utilisons vos informations pour :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Fournir, maintenir et améliorer le service.</li>
            <li>Gérer votre compte et vos abonnements.</li>
            <li>Personnaliser l'expérience utilisateur (par exemple, via la fonctionnalité de mémoire).</li>
            <li>Communiquer avec vous concernant des mises à jour ou des informations sur le service.</li>
            <li>Améliorer la qualité et la sécurité de nos modèles (uniquement avec votre consentement explicite).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Partage des informations</h2>
          <p>Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations avec :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Des fournisseurs de services tiers (hébergement, API de modèles IA, traitement des paiements) qui ont besoin d'accéder à ces informations pour effectuer leur travail pour nous.</li>
            <li>Les autorités légales si la loi l'exige.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Vos droits et choix</h2>
          <p>Vous avez le contrôle sur vos données :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Vous pouvez accéder à vos informations et les modifier depuis les paramètres de votre compte.</li>
            <li>Vous pouvez télécharger l'historique de vos conversations.</li>
            <li>Vous pouvez supprimer les "souvenirs" que l'IA a stockés.</li>
            <li>Vous pouvez supprimer votre compte à tout moment, ce qui effacera vos informations personnelles et votre contenu.</li>
          </ul>
        </section>
        
         <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Sécurité</h2>
          <p>Nous prenons des mesures raisonnables pour protéger vos informations contre la perte, le vol, l'abus, et l'accès non autorisé. Cependant, aucune méthode de transmission sur Internet n'est 100% sécurisée.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter en envoyant un e-mail à :{' '}
            <a href="https://cygnis.gt.tc/contact.php" className="font-medium text-primary underline hover:text-primary/80">
              privacy@cygnis.ai
            </a>
            .
          </p>
        </section>
      </div>
    </GenericPage>
  );
}
