from django.db import models


class ParametreSysteme(models.Model):
    cle = models.CharField(max_length=100, unique=True)
    valeur = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["cle"]

    def __str__(self) -> str:
        return self.cle

    @classmethod
    def get_int(cls, cle: str, default: int) -> int:
        valeur = cls.objects.filter(cle=cle).values_list("valeur", flat=True).first()
        if valeur is None:
            return default
        try:
            return int(valeur)
        except (TypeError, ValueError):
            return default
