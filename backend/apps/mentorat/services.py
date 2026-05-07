from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from apps.users.models import NiveauAcademique, Utilisateur


def get_mentors_disponibles_for_niveau(niveau_id):
    niveau = get_object_or_404(NiveauAcademique, pk=niveau_id)
    ordre_mentor = niveau.ordre_niveau + 1
    candidats = (
        Utilisateur.objects.select_related("role", "niveau_academique")
        .filter(
            Q(profil_mentorat=Utilisateur.ProfilMentorat.MENTOR)
            | Q(profil_mentorat=Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE),
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            niveau_academique__ordre_niveau=ordre_mentor,
        )
        .order_by("nom", "prenom")
    )
    return [mentor for mentor in candidats if mentor.capacite_restante() > 0]


def validate_mentor_for_mentore_level(mentor: Utilisateur, niveau_mentore: NiveauAcademique):
    if not mentor.est_mentor:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a pas un profil mentor."})
    if mentor.statut_compte != Utilisateur.StatutCompte.ACTIF:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'est pas actif."})
    if not mentor.niveau_academique_id:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a pas de niveau academique."})
    if mentor.niveau_academique.ordre_niveau != niveau_mentore.ordre_niveau + 1:
        raise serializers.ValidationError(
            {"mentor_choisi": "Le mentor choisi doit etre au niveau superieur direct."}
        )
    if mentor.capacite_restante() <= 0:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a plus de capacite disponible."})
