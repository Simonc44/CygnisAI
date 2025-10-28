
'use client';
import { GenericPage } from "@/components/generic-page";

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <GenericPage
      title="Conditions d'utilisation"
      description={`Dernière mise à jour : ${lastUpdated}`}
    >
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Bienvenue sur CygnisAI ("le Service"). En accédant ou en utilisant notre service, vous acceptez d'être lié par ces conditions ("Conditions"). Si vous n'êtes pas d'accord, vous ne pouvez pas utiliser le Service.</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Utilisation du Service</h2>
          <p>Vous acceptez d'utiliser CygnisAI uniquement à des fins légales et conformément à ces Conditions. Vous êtes responsable de votre conduite et de votre contenu.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Compte utilisateur :</strong> Vous devez fournir des informations exactes lors de la création de votre compte. Vous êtes responsable de la sécurité de votre mot de passe et de toutes les activités qui se déroulent sur votre compte.</li>
            <li><strong>Usage interdit :</strong> Il est interdit d'utiliser le service pour générer du contenu illégal, haineux, ou qui viole les droits d'autrui. L'utilisation de moyens automatisés pour surcharger nos systèmes est également proscrite.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Contenu</h2>
          <p>Vous conservez tous les droits sur le contenu que vous créez ou soumettez au Service. En utilisant le Service, vous nous accordez une licence mondiale, non exclusive et libre de droits pour utiliser, héberger, stocker et reproduire votre contenu dans le seul but de vous fournir et d'améliorer le Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Abonnements et Paiements</h2>
          <p>Certaines fonctionnalités du Service sont disponibles via un abonnement payant ("Plan Pro").</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Les frais d'abonnement sont facturés de manière récurrente. Vous pouvez annuler votre abonnement à tout moment.</li>
            <li>Les paiements ne sont pas remboursables, sauf si la loi l'exige.</li>
            <li>Nous nous réservons le droit de modifier nos tarifs. Tout changement de prix sera communiqué à l'avance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Limitation de responsabilité</h2>
          <p>Le Service est fourni "tel quel". Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou sans erreur. En aucun cas CygnisAI ne pourra être tenu responsable des dommages indirects, accessoires ou consécutifs résultant de votre utilisation du Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Modification des Conditions</h2>
          <p>Nous nous réservons le droit de modifier ces Conditions à tout moment. Si une modification est importante, nous vous en informerons. En continuant à utiliser le Service après l'entrée en vigueur des modifications, vous acceptez d'être lié par les nouvelles conditions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
          <p>Pour toute question concernant ces Conditions, veuillez nous contacter à l'adresse <a href="https://cygnis.gt.tc/contact.php" className="text-primary underline">terms@cygnis.ai</a>.</p>
        </section>
      </div>
    </GenericPage>
  );
}
