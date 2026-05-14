import os

from django.core.management.base import BaseCommand, CommandError

from apps.parametres.models import ParametreSysteme
from apps.users.models import NiveauAcademique, Role, Utilisateur


ROLES_DEFAUT = [
    (Role.Nom.ADMIN_PRINCIPAL, "Acces complet a la plateforme."),
    (Role.Nom.ADMIN_OPERATIONNEL, "Gestion operationnelle sans creation d'administrateur."),
    (Role.Nom.MENTOR, "Utilisateur mentor."),
    (Role.Nom.MENTORE, "Utilisateur mentore."),
]

NIVEAUX_DEFAUT = [
    ("Je suis au secondaire", "mentoree_secondary", 1, True, False),
    (
        "Je suis etudiant(e) au college ou en 1ere / 2e annee de baccalaureat",
        "mentor_level_1",
        2,
        False,
        False,
    ),
    (
        "Je suis etudiant(e) en 3e / 4e annee de baccalaureat ou a la maitrise",
        "mentor_level_2",
        3,
        False,
        False,
    ),
    ("Je suis etudiant(e) en medecine", "mentor_level_3", 4, False, True),
]


class Command(BaseCommand):
    help = "Initialise les donnees critiques du flux Mentorat et cree l'ADMIN_PRINCIPAL initial."

    def add_arguments(self, parser):
        parser.add_argument("--admin-email", default=os.environ.get("INITIAL_ADMIN_EMAIL"))
        parser.add_argument("--admin-password", default=os.environ.get("INITIAL_ADMIN_PASSWORD"))
        parser.add_argument("--admin-nom", default=os.environ.get("INITIAL_ADMIN_NOM", "Principal"))
        parser.add_argument("--admin-prenom", default=os.environ.get("INITIAL_ADMIN_PRENOM", "Admin"))

    def handle(self, *args, **options):
        self._creer_roles()
        self._creer_niveaux()
        self._creer_parametres()
        self._creer_admin_initial(options)
        self.stdout.write(self.style.SUCCESS("Initialisation Mentorat terminee."))

    def _creer_roles(self):
        for nom, description in ROLES_DEFAUT:
            Role.objects.update_or_create(nom=nom, defaults={"description": description})
        self.stdout.write("Roles par defaut verifies.")

    def _creer_niveaux(self):
        for nom, code, ordre_niveau, est_premier_niveau, est_dernier_niveau in NIVEAUX_DEFAUT:
            NiveauAcademique.objects.update_or_create(
                ordre_niveau=ordre_niveau,
                defaults={
                    "nom": nom,
                    "code": code,
                    "est_premier_niveau": est_premier_niveau,
                    "est_dernier_niveau": est_dernier_niveau,
                },
            )
        self.stdout.write("Niveaux academiques par defaut verifies.")

    def _creer_parametres(self):
        ParametreSysteme.objects.update_or_create(
            cle="MAX_MENTORES_PAR_MENTOR",
            defaults={
                "valeur": "5",
                "description": "Limite maximale globale de mentores par mentor.",
            },
        )
        self.stdout.write("Parametres systeme verifies.")

    def _creer_admin_initial(self, options):
        role_admin, _ = Role.objects.get_or_create(
            nom=Role.Nom.ADMIN_PRINCIPAL,
            defaults={"description": "Acces complet a la plateforme."},
        )
        if Utilisateur.objects.filter(role=role_admin).exists():
            self.stdout.write("Un ADMIN_PRINCIPAL existe deja.")
            return

        email = options["admin_email"]
        password = options["admin_password"]
        if not email or not password:
            raise CommandError(
                "Aucun ADMIN_PRINCIPAL n'existe. Fournissez --admin-email et --admin-password "
                "ou les variables INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD."
            )

        Utilisateur.objects.create_user(
            email=email,
            password=password,
            nom=options["admin_nom"],
            prenom=options["admin_prenom"],
            role=role_admin,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(self.style.SUCCESS(f"ADMIN_PRINCIPAL initial cree: {email}"))
